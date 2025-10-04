import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  ComputeTimekeepingDTO,
  TimeInOutDTO,
  EmployeeTimekeepingDTO,
  RequestEmployeeTimekeepingByDate,
  RecomputeTimekeepingDTO,
  RecomputeCutoffTimekeepingDTO,
} from './employee-timekeeping.interface';
import { UtilityService } from '@common/utility.service';
import { TimekeepingComputationService } from '@modules/hr/computation/hris-computation/timekeeping-computation/timekeeping-computation.service';
import { TimekeepingGroupingService } from '@modules/hr/computation/hris-computation/timekeeping-grouping/timekeeping-grouping.service';
import BreakdownTypeReference from '../../../../reference/timekeeping-breakdown-type.reference';
import {
  EmployeeTimekeeping,
  Prisma,
  CutoffDateRange,
  EmployeeTimekeepingCutoff,
  EmployeeData,
  Account,
  ActiveShiftType,
  EmployeeTimekeepingLogs,
  EmployeeTimekeepingRaw,
  EmployeeTimekeepingOverride,
  EmployeeTimekeepingHoliday,
  EmployeeTimekeepingComputed,
  CutoffDateRangeStatus,
  QueueType,
  ScopeList,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import ActiveShiftTypeReference from '../../../../reference/active-shift-type.reference';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import TimeekeepingSourceReference from '../../../../reference/timekeeping-source.reference';
import { CutoffConfigurationService } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.service';
import HolidayTypeReference from '../../../../reference/holiday-type.reference';
import { QueueService } from '@infrastructure/queue/queue/queue.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';

import * as moment from 'moment';
import {
  TimeBreakdownResponse,
  TimeKeepingComputeResponseData,
  TimekeepingOutputResponse,
  TimekeepingDataResponse,
  EmployeeTimekeepingTotal,
  CutoffDateRangeResponse,
  CutoffDateRangeLiteResponse,
  RawTimeInOutResponse,
  TimekeepingLogResponse,
  TimekeepingOverrideResponse,
  TimekeepingHoliday,
  TimekeepingComputedResponse,
  GracePeriodInfo,
} from '../../../../shared/response/timekeeping.response';
import { ModuleRef } from '@nestjs/core';
import { DateFormat, ShiftDataResponse } from '../../../../shared/response';
import {
  RecomputeAllTimekeepingRequest,
  SubmitForPayrollProcessingRequest,
  TimeInOutRequest,
  TimekeepingOverrideRequest,
} from '../../../../shared/request';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { LeaveTimekeepingIntegrationService } from '@modules/hr/filing/services/leave-timekeeping-integration.service';
import { AttendanceConflictsService } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.service';

@Injectable()
export class EmployeeTimekeepingService {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly tableHandlerService: TableHandlerService;
  @Inject()
  private readonly cutoffConfigurationService: CutoffConfigurationService;
  @Inject() private readonly queueService: QueueService;
  @Inject() private readonly employeeListService: EmployeeListService;
  @Inject()
  private readonly attendanceConflictsService: AttendanceConflictsService;
  private leaveTimekeepingIntegrationService: LeaveTimekeepingIntegrationService;

  constructor(private readonly moduleRef: ModuleRef) {}

  async approveDay(timekeepingId: number) {
    const timekeepingData = await this.prisma.employeeTimekeeping.findUnique({
      where: { id: timekeepingId },
      include: { employeeTimekeepingCutoff: true },
    });

    if (!timekeepingData) {
      throw new BadRequestException('Timekeeping data not found');
    }

    await this.prisma.employeeTimekeeping.update({
      where: { id: timekeepingId },
      data: {
        isDayApproved: !timekeepingData.isDayApproved,
      },
    });

    await this.recompute({
      employeeAccountId: timekeepingData.employeeTimekeepingCutoff.accountId,
      date: timekeepingData.dateString,
    });
  }

  async toggleHolidayEligibility(timekeepingId: number) {
    const timekeepingData = await this.prisma.employeeTimekeeping.findUnique({
      where: { id: timekeepingId },
      include: { employeeTimekeepingCutoff: true },
    });

    if (!timekeepingData) {
      throw new BadRequestException('Timekeeping data not found');
    }

    // Toggle logic:
    // - If no override exists, create one with opposite of current eligibility
    // - If override exists, remove it (go back to automatic)
    const newOverrideValue =
      timekeepingData.isEligibleHolidayOverride === null
        ? !timekeepingData.isEligibleHoliday
        : null;

    await this.prisma.employeeTimekeeping.update({
      where: { id: timekeepingId },
      data: {
        isEligibleHolidayOverride: newOverrideValue,
        isEligibleHoliday:
          newOverrideValue ?? timekeepingData.isEligibleHoliday,
      },
    });

    // Recompute to update calculations
    await this.recompute({
      employeeAccountId: timekeepingData.employeeTimekeepingCutoff.accountId,
      date: timekeepingData.dateString,
    });
  }

  async approveOvertime(
    timekeepingId: number,
    dateString: string,
  ): Promise<void> {
    const timekeeping = await this.prisma.employeeTimekeeping.findUnique({
      where: { id: timekeepingId },
      include: { employeeTimekeepingCutoff: true },
    });

    if (!timekeeping) {
      throw new BadRequestException('Timekeeping data not found');
    }

    // Find all pending overtime filings for this date
    const { PayrollFilingType, PayrollFilingStatus } = await import(
      '@prisma/client'
    );
    const pendingFilings = await this.prisma.payrollFiling.findMany({
      where: {
        accountId: timekeeping.employeeTimekeepingCutoff.accountId,
        date: new Date(dateString),
        filingType: PayrollFilingType.OVERTIME,
        status: PayrollFilingStatus.PENDING,
      },
    });

    if (pendingFilings.length === 0) {
      throw new BadRequestException(
        'No pending overtime filings found for this date',
      );
    }

    // Get the approval service using moduleRef
    const { ApprovalService } = await import(
      '../../../approval/approval.service'
    );
    const approvalService = this.moduleRef.get(ApprovalService, {
      strict: false,
    });

    // Approve each filing using the existing approval system
    for (const filing of pendingFilings) {
      if (filing.approvalTaskId) {
        // Find the associated task
        const task = await this.prisma.task.findUnique({
          where: { id: filing.approvalTaskId },
        });

        if (task) {
          await approvalService.processApproval({
            taskId: task.id,
            action: 'approve',
            remarks: 'Approved via payroll timekeeping interface',
          });
        }
      }
    }

    // The FilingApprovalStrategy will automatically:
    // - Update filing status to APPROVED
    // - Call updateTimekeepingFromFiling to move hours from ForApproval to Approved
    // - Send notifications
    // - Emit socket events that update TaskWidget and RequestPanelWidget
  }

  async overrideTimekeepingClear(timekeepingId: number): Promise<void> {
    const timekeepingData = await this.prisma.employeeTimekeeping.findUnique({
      where: { id: timekeepingId },
      include: { employeeTimekeepingCutoff: true },
    });

    if (!timekeepingData) {
      throw new BadRequestException('Timekeeping data not found');
    }

    if (timekeepingData.overrideId) {
      await this.prisma.employeeTimekeepingOverride.deleteMany({
        where: { id: timekeepingData.overrideId },
      });
    }

    await this.recompute({
      employeeAccountId: timekeepingData.employeeTimekeepingCutoff.accountId,
      date: timekeepingData.dateString,
    });
  }
  async overrideTimekeeping(body: TimekeepingOverrideRequest): Promise<void> {
    const timekeepingData = await this.prisma.employeeTimekeeping.findUnique({
      where: { id: body.timekeepingId },
      include: { employeeTimekeepingCutoff: true },
    });
    const createTimekeepingOverrideParams: Prisma.EmployeeTimekeepingOverrideCreateInput =
      {
        timekeepingId: timekeepingData.id,
        workMinutes: body.worktime,
        nightDifferentialMinutes: body.nightDifferential,
        nightDifferentialOvertimeMinutes: body.nightDifferentialOvertime,
        overtimeMinutes: body.overtime,
        lateMinutes: body.late,
        undertimeMinutes: body.undertime,
      };

    await this.prisma.employeeTimekeepingOverride.deleteMany({
      where: { timekeepingId: timekeepingData.id },
    });
    const timekeeping: EmployeeTimekeepingOverride =
      await this.prisma.employeeTimekeepingOverride.create({
        data: createTimekeepingOverrideParams,
      });

    await this.prisma.employeeTimekeeping.update({
      where: { id: timekeepingData.id },
      data: {
        overrideId: timekeeping.id,
      },
    });

    await this.recompute({
      employeeAccountId: timekeepingData.employeeTimekeepingCutoff.accountId,
      date: timekeepingData.dateString,
    });
  }
  async getTimekeepingEmployeeList(
    cutoffDateRangeId: string,
    branchIds?: number[],
    search?: string,
  ): Promise<EmployeeTimekeepingTotal[]> {
    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: cutoffDateRangeId },
      });

    // Get all employees for this cutoff
    let employeeList: EmployeeData[] =
      await this.employeeListService.getEmployeeListByPayrollByCutoff(
        cutoffDateRange.cutoffId,
      );

    // Filter by branches
    if (branchIds && branchIds.length > 0) {
      // If branches are explicitly selected, filter by those branches (for full access users)
      employeeList = employeeList.filter((employee) =>
        branchIds.includes(employee.branchId),
      );
    } else if (
      !this.utilityService.hasScope(ScopeList.MANPOWER_TIME_KEEPING_ACCESS_ALL)
    ) {
      // If user doesn't have full access, filter by their branch
      const userBranchId = await this.utilityService.getUserBranchId();
      if (userBranchId) {
        employeeList = employeeList.filter(
          (employee) => employee.branchId === userBranchId,
        );
      } else {
        // User doesn't have a branch assigned, return empty list
        return [];
      }
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();

      // Get account details for all employees to search by name
      const employeeAccountIds = employeeList.map((emp) => emp.accountId);
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: employeeAccountIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
        },
      });

      // Create a map for quick lookup
      const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));

      employeeList = employeeList.filter((employee) => {
        // Search by employee code
        if (employee.employeeCode.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search by name
        const account = accountMap.get(employee.accountId);
        if (account) {
          const fullName =
            `${account.firstName} ${account.middleName || ''} ${account.lastName}`.toLowerCase();
          return fullName.includes(searchTerm);
        }

        return false;
      });
    }

    const response: EmployeeTimekeepingTotal[] = await Promise.all(
      employeeList.map(async (data) => {
        return await this.formatResponseTotalTimekeepingData(
          data,
          cutoffDateRange,
        );
      }),
    );

    return response;
  }

  async getTimekeepingEmployeeListPaginated(
    cutoffDateRangeId: string,
    page: number,
    limit: number,
    branchIds?: number[],
    search?: string,
    employmentStatusId?: string,
    departmentId?: string,
    roleId?: string,
  ): Promise<{
    data: EmployeeTimekeepingTotal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: cutoffDateRangeId },
      });

    // Get all employees for this cutoff
    let employeeList: EmployeeData[] =
      await this.employeeListService.getEmployeeListByPayrollByCutoff(
        cutoffDateRange.cutoffId,
      );

    // Filter by branches
    if (branchIds && branchIds.length > 0) {
      employeeList = employeeList.filter((employee) =>
        branchIds.includes(employee.branchId),
      );
    } else if (
      !this.utilityService.hasScope(ScopeList.MANPOWER_TIME_KEEPING_ACCESS_ALL)
    ) {
      const userBranchId = await this.utilityService.getUserBranchId();
      if (userBranchId) {
        employeeList = employeeList.filter(
          (employee) => employee.branchId === userBranchId,
        );
      } else {
        return { data: [], total: 0, page, limit };
      }
    }

    // Apply additional filters - need to fetch account data for role filter
    if (roleId) {
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: employeeList.map((emp) => emp.accountId) },
          roleId: roleId,
        },
      });

      const validAccountIds = new Set(accounts.map((acc) => acc.id));
      employeeList = employeeList.filter((emp) =>
        validAccountIds.has(emp.accountId),
      );
    }

    // Apply employment status filter
    if (employmentStatusId) {
      const employeeAccountIds = employeeList.map((emp) => emp.accountId);
      const validContracts = await this.prisma.employeeContract.findMany({
        where: {
          accountId: { in: employeeAccountIds },
          employmentStatus: employmentStatusId as any, // Cast to enum type
          isActive: true,
        },
        select: { accountId: true },
      });

      const validAccountIds = new Set(
        validContracts.map((contract) => contract.accountId),
      );
      employeeList = employeeList.filter((emp) =>
        validAccountIds.has(emp.accountId),
      );
    }

    // Apply department filter
    if (departmentId) {
      const employeeAccountIds = employeeList.map((emp) => emp.accountId);
      const validAccounts = await this.prisma.account.findMany({
        where: {
          id: { in: employeeAccountIds },
          role: {
            roleGroupId: departmentId,
          },
        },
        select: { id: true },
      });

      const validAccountIds = new Set(validAccounts.map((acc) => acc.id));
      employeeList = employeeList.filter((emp) =>
        validAccountIds.has(emp.accountId),
      );
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const employeeAccountIds = employeeList.map((emp) => emp.accountId);
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: employeeAccountIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
        },
      });

      const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));

      employeeList = employeeList.filter((employee) => {
        if (employee.employeeCode.toLowerCase().includes(searchTerm)) {
          return true;
        }

        const account = accountMap.get(employee.accountId);
        if (account) {
          const fullName =
            `${account.firstName} ${account.middleName || ''} ${account.lastName}`.toLowerCase();
          return fullName.includes(searchTerm);
        }

        return false;
      });
    }

    // Calculate pagination
    const total = employeeList.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedList = employeeList.slice(startIndex, endIndex);

    // Format response
    const data: EmployeeTimekeepingTotal[] = await Promise.all(
      paginatedList.map(async (employee) => {
        return await this.formatResponseTotalTimekeepingData(
          employee,
          cutoffDateRange,
        );
      }),
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getTimekeepingTotals(
    cutoffDateRangeId: string,
    branchIds?: number[],
    search?: string,
    employmentStatusId?: string,
    departmentId?: string,
    roleId?: string,
  ): Promise<{
    totalEmployees: number;
    totalHours: number;
    totalOvertime: number;
    totalLate: number;
    totalUndertime: number;
    totalAbsent: number;
    totalPresentDays: number;
    totalWorkDays: number;
  }> {
    // Get the full list using the existing method
    const employeeList = await this.getTimekeepingEmployeeList(
      cutoffDateRangeId,
      branchIds,
      search,
    );

    // Apply additional filters
    let filteredList = employeeList;

    // Apply role filter if provided
    if (roleId) {
      const accounts = await this.prisma.account.findMany({
        where: {
          id: {
            in: employeeList.map(
              (emp) => emp.employeeAccountInformation.accountId,
            ),
          },
          roleId: roleId,
        },
      });

      const validAccountIds = new Set(accounts.map((acc) => acc.id));
      filteredList = employeeList.filter((emp) =>
        validAccountIds.has(emp.employeeAccountInformation.accountId),
      );
    }

    // Apply employment status filter
    if (employmentStatusId) {
      const employeeAccountIds = filteredList.map(
        (emp) => emp.employeeAccountInformation.accountId,
      );
      const validContracts = await this.prisma.employeeContract.findMany({
        where: {
          accountId: { in: employeeAccountIds },
          employmentStatus: employmentStatusId as any, // Cast to enum type
          isActive: true,
        },
        select: { accountId: true },
      });

      const validAccountIds = new Set(
        validContracts.map((contract) => contract.accountId),
      );
      filteredList = filteredList.filter((emp) =>
        validAccountIds.has(emp.employeeAccountInformation.accountId),
      );
    }

    // Apply department filter
    if (departmentId) {
      const employeeAccountIds = filteredList.map(
        (emp) => emp.employeeAccountInformation.accountId,
      );
      const validAccounts = await this.prisma.account.findMany({
        where: {
          id: { in: employeeAccountIds },
          role: {
            roleGroupId: departmentId,
          },
        },
        select: { id: true },
      });

      const validAccountIds = new Set(validAccounts.map((acc) => acc.id));
      filteredList = filteredList.filter((emp) =>
        validAccountIds.has(emp.employeeAccountInformation.accountId),
      );
    }

    // Calculate totals
    const totals = filteredList.reduce(
      (acc, employee) => {
        const tt = employee.timekeepingTotal;
        return {
          totalEmployees: acc.totalEmployees + 1,
          totalHours:
            acc.totalHours +
            (tt.workTime.raw || 0) +
            (tt.overtimeApproved.raw || 0),
          totalOvertime:
            acc.totalOvertime +
            (tt.overtimeApproved.raw || 0) +
            (tt.nightDifferentialOvertimeApproved.raw || 0),
          totalLate: acc.totalLate + (tt.late.raw || 0),
          totalUndertime: acc.totalUndertime + (tt.undertime.raw || 0),
          totalAbsent: acc.totalAbsent + (tt.absentCount || 0),
          totalPresentDays: acc.totalPresentDays + (tt.presentDayCount || 0),
          totalWorkDays: acc.totalWorkDays + (tt.workDayCount || 0),
        };
      },
      {
        totalEmployees: 0,
        totalHours: 0,
        totalOvertime: 0,
        totalLate: 0,
        totalUndertime: 0,
        totalAbsent: 0,
        totalPresentDays: 0,
        totalWorkDays: 0,
      },
    );

    return totals;
  }

  async getEmployeeTimekeepingTotal(
    params: EmployeeTimekeepingDTO,
  ): Promise<EmployeeTimekeepingTotal> {
    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: params.cutoffDateRange },
      });
    const employeeInformation: EmployeeData =
      await this.prisma.employeeData.findUnique({
        where: { accountId: params.employeeAccountId },
      });

    if (!employeeInformation) {
      throw new BadRequestException('Employee not found');
    }

    const employeeTimekeepingCutoff: EmployeeTimekeepingCutoff =
      await this.prisma.employeeTimekeepingCutoff.findUnique({
        where: {
          accountId_cutoffDateRangeId: {
            accountId: employeeInformation.accountId,
            cutoffDateRangeId: cutoffDateRange.id,
          },
        },
      });

    if (!employeeTimekeepingCutoff) {
      return {
        employeeCode: employeeInformation.employeeCode,
        timekeepingCutoffId: 0,
        employeeAccountInformation: {
          accountId: employeeInformation.accountId,
          fullName: '',
          firstName: '',
          lastName: '',
          middleName: '',
        },
        timekeepingTotal: this.returBlankTimekeepingData(),
      };
    }

    return await this.formatResponseTotalTimekeepingData(
      employeeInformation,
      cutoffDateRange,
    );
  }

  async employeeTimekeepingRawLogs(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'employeeData');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    if (!query.employeeAccountId || !query.cutoffDateRangeId) {
      throw new BadRequestException(
        'Employee Account ID and Cutoff Date Range ID are required.',
      );
    }

    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: query.cutoffDateRangeId },
      });

    if (!cutoffDateRange) {
      throw new BadRequestException('Cutoff date range not found.');
    }

    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      accountId: query.employeeAccountId,
      timeIn: {
        gte: cutoffDateRange.startDate.toISOString(),
        lte: moment(cutoffDateRange.endDate).endOf('day').toISOString(),
      },
    };

    tableQuery['orderBy'] = {
      timeIn: 'asc',
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.employeeTimekeepingRaw,
      query,
      tableQuery,
    );
    const formattedList = await Promise.all(
      baseList.map(async (data: EmployeeTimekeepingRaw) => {
        return await this.formatLogResponse(data);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async deleteEmployeeTimekeepingRawLog(id: number): Promise<void> {
    id = Number(id);
    const timekeepingRawLog: EmployeeTimekeepingRaw =
      await this.prisma.employeeTimekeepingRaw.findUnique({ where: { id } });

    if (!timekeepingRawLog) {
      throw new BadRequestException('Timekeeping raw log not found');
    }

    await this.prisma.employeeTimekeepingRaw.delete({ where: { id } });

    /* save raw logs */
    const fromDate: DateFormat = this.utilityService.formatDate(
      timekeepingRawLog.timeIn,
    );
    const toDate: DateFormat = this.utilityService.formatDate(
      timekeepingRawLog.timeOut,
    );

    /* compute timekeeping logs */
    let currentDate = moment(fromDate.raw).startOf('day');
    const endDate = moment(toDate.raw).startOf('day');

    while (currentDate.isSameOrBefore(endDate)) {
      const timekeepingComputationService = await this.moduleRef.create(
        TimekeepingComputationService,
      );
      const currentDateFormatted = this.utilityService.formatDate(
        currentDate.toDate(),
      );
      timekeepingComputationService.setEmployeeAccountId(
        timekeepingRawLog.accountId,
      );
      timekeepingComputationService.setDate(currentDateFormatted);
      await timekeepingComputationService.computeTimekeeping();
      currentDate = currentDate.add(1, 'day');
    }
  }

  async getEmployeeTimekeepingCutoffDateRange(): Promise<
    CutoffDateRangeResponse[]
  > {
    await this.cutoffConfigurationService.populateDateRange();
    const response: CutoffDateRangeResponse[] =
      await this.cutoffConfigurationService.getDateRangeList('TIMEKEEPING');
    return response;
  }

  /**
   * Lightweight version of getEmployeeTimekeepingCutoffDateRange
   * Optimized for performance - uses single query with join
   * SKIPS populateDateRange() to avoid slow sequential queries
   */
  async getEmployeeTimekeepingCutoffDateRangeLite(): Promise<
    CutoffDateRangeLiteResponse[]
  > {
    // PERFORMANCE: Skip populateDateRange() - it's too slow (28s for 109 records)
    // populateDateRange() runs on a scheduler, we just read existing data
    const response: CutoffDateRangeLiteResponse[] =
      await this.cutoffConfigurationService.getDateRangeListLite('TIMEKEEPING');
    return response;
  }

  async getEmployeeTimekeeping(
    params: EmployeeTimekeepingDTO,
  ): Promise<TimekeepingOutputResponse[]> {
    this.utilityService.log(
      `[TIMEKEEPING-API] getEmployeeTimekeeping called with cutoffDateRange: ${params.cutoffDateRange}, employeeAccountId: ${params.employeeAccountId}`,
    );
    const response = [];
    const cutoffInformation = await this.prisma.cutoffDateRange.findUnique({
      where: { id: params.cutoffDateRange },
      include: { cutoff: true },
    });

    // create date ranges from startDate to endDate
    let currentDate = moment(cutoffInformation.startDate);

    const dateRange = [];

    while (currentDate.isSameOrBefore(cutoffInformation.endDate)) {
      dateRange.push(
        await this.getEmployeeTimekeepingByDate({
          employeeAccountId: params.employeeAccountId,
          date: this.utilityService.formatDate(currentDate.toDate()),
          cutoffDateRangeId: params.cutoffDateRange,
        }),
      );

      currentDate = currentDate.add(1, 'day');
    }

    const timekeepingDataArray = await Promise.all(dateRange);
    response.push(...timekeepingDataArray);

    return response;
  }

  /* timekeeping simulation */
  async compute(
    body: ComputeTimekeepingDTO,
  ): Promise<TimeKeepingComputeResponseData> {
    const inputTimeInOut: TimeInOutRequest[] = body.simulatedTime;
    const rawTimeInOut: RawTimeInOutResponse[] = await this.formatInOutData(
      body.simulatedTime,
    );

    /* save raw logs */
    await this.recordRawTimeInOut(body.employeeAccountId, rawTimeInOut);
    const fromDate: DateFormat = this.utilityService.formatDate(
      rawTimeInOut[0].timeIn,
    );
    const toDate: DateFormat = this.utilityService.formatDate(
      rawTimeInOut[rawTimeInOut.length - 1].timeOut,
    );

    /* save timekeepings logs */
    const timekeepingGroupingService = await this.moduleRef.create(
      TimekeepingGroupingService,
    );
    timekeepingGroupingService.initialize(
      body.employeeAccountId,
      fromDate,
      toDate,
    );
    await timekeepingGroupingService.saveTimekeepingLogs();

    /* compute timekeeping logs */
    let currentDate = moment(fromDate.raw).startOf('day');
    const endDate = moment(toDate.raw).startOf('day');

    while (currentDate.isSameOrBefore(endDate)) {
      const timekeepingComputationService = await this.moduleRef.create(
        TimekeepingComputationService,
      );
      const currentDateFormatted = this.utilityService.formatDate(
        currentDate.toDate(),
      );
      timekeepingComputationService.setEmployeeAccountId(
        body.employeeAccountId,
      );
      timekeepingComputationService.setDate(currentDateFormatted);
      await timekeepingComputationService.computeTimekeeping();
      currentDate = currentDate.add(1, 'day');
    }

    /* create output */
    const output: TimekeepingOutputResponse[] = [];

    currentDate = moment(fromDate.raw).startOf('day');
    while (currentDate.isSameOrBefore(endDate)) {
      const timekeepingOutput = await this.getEmployeeTimekeepingByDate({
        employeeAccountId: body.employeeAccountId,
        date: this.utilityService.formatDate(currentDate.toDate()),
      });

      output.push(timekeepingOutput);
      currentDate = currentDate.add(1, 'day');
    }

    const response: TimeKeepingComputeResponseData = {
      employeeId: body.employeeAccountId,
      rawTimeInOut: rawTimeInOut,
      inputTimeInOut: inputTimeInOut,
      output,
    };

    return response;
  }
  public async recompute(body: RecomputeTimekeepingDTO): Promise<void> {
    this.utilityService.log(
      `[RECOMPUTE] Starting recompute for employeeAccountId: ${body.employeeAccountId}, date: ${body.date}`,
    );

    // Check if raw logs exist for this date
    const dateStart = new Date(body.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(body.date);
    dateEnd.setHours(23, 59, 59, 999);

    const rawLogsCount = await this.prisma.employeeTimekeepingRaw.count({
      where: {
        accountId: body.employeeAccountId,
        timeIn: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    });

    this.utilityService.log(
      `[RECOMPUTE] Raw logs count for date ${body.date}: ${rawLogsCount}`,
    );

    const timekeepingGroupingService = await this.moduleRef.create(
      TimekeepingGroupingService,
    );
    const dateFormatted = this.utilityService.formatDate(body.date);

    this.utilityService.log(
      `[RECOMPUTE] Initializing TimekeepingGroupingService with dateFormatted: ${JSON.stringify(dateFormatted)}`,
    );
    timekeepingGroupingService.initialize(
      body.employeeAccountId,
      dateFormatted,
      dateFormatted,
    );

    this.utilityService.log(`[RECOMPUTE] Calling saveTimekeepingLogs...`);
    await timekeepingGroupingService.saveTimekeepingLogs();
    this.utilityService.log(`[RECOMPUTE] saveTimekeepingLogs completed`);

    const timekeepingComputationService = await this.moduleRef.create(
      TimekeepingComputationService,
    );
    const currentDateFormatted = this.utilityService.formatDate(body.date);

    this.utilityService.log(
      `[RECOMPUTE] Setting up TimekeepingComputationService...`,
    );
    timekeepingComputationService.setEmployeeAccountId(body.employeeAccountId);
    timekeepingComputationService.setDate(currentDateFormatted);

    this.utilityService.log(`[RECOMPUTE] Starting computeTimekeeping...`);
    await timekeepingComputationService.computeTimekeeping();
    this.utilityService.log(`[RECOMPUTE] computeTimekeeping completed`);

    // Sync overtime filings after computation to preserve the values
    try {
      this.utilityService.log(`[RECOMPUTE] Syncing overtime filings...`);
      const { OvertimeFilingIntegrationService } = await import(
        '../../filing/services/overtime-filing-integration.service'
      );
      const overtimeFilingIntegrationService = await this.moduleRef.create(
        OvertimeFilingIntegrationService,
      );
      await overtimeFilingIntegrationService.syncFilingsToTimekeeping(
        body.employeeAccountId,
        new Date(body.date),
      );
      this.utilityService.log(`[RECOMPUTE] Overtime filings sync completed`);
    } catch (error) {
      this.utilityService.log(
        `Failed to sync overtime filings: ${error.message}`,
      );
    }

    // Detect attendance conflicts after computation
    try {
      this.utilityService.log(`[RECOMPUTE] Detecting attendance conflicts...`);

      // Get the timekeeping record for conflict detection
      const timekeepingRecord = await this.prisma.employeeTimekeeping.findFirst(
        {
          where: {
            dateString: body.date,
            employeeTimekeepingCutoff: {
              accountId: body.employeeAccountId,
            },
          },
        },
      );

      // Detect conflicts for this date
      await this.attendanceConflictsService.detectConflicts(
        body.employeeAccountId,
        dateFormatted,
        timekeepingRecord,
      );

      // If timekeeping record exists and computation was successful, resolve any existing conflicts
      if (timekeepingRecord) {
        await this.attendanceConflictsService.resolveConflictsForDate(
          body.employeeAccountId,
          body.date,
          'RECOMPUTE',
        );
      }

      this.utilityService.log(
        `[RECOMPUTE] Attendance conflict detection completed`,
      );
    } catch (error) {
      this.utilityService.log(
        `[RECOMPUTE] Failed to detect attendance conflicts: ${error.message}`,
      );
      // Don't throw - conflict detection failure shouldn't stop the recompute
    }

    this.utilityService.log(`[RECOMPUTE] Recompute completed successfully`);
  }
  public async recomputeCutoff(
    body: RecomputeCutoffTimekeepingDTO,
  ): Promise<void> {
    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: body.cutoffDateRangeId },
      });

    // loop date ranges and call recompute
    let currentDate = moment(cutoffDateRange.startDate).startOf('day');
    const endDate = moment(cutoffDateRange.endDate).endOf('day');
    while (currentDate.isSameOrBefore(endDate)) {
      await this.recompute({
        employeeAccountId: body.employeeAccountId,
        date: currentDate.format('YYYY-MM-DD'),
      });

      currentDate = currentDate.add(1, 'day');
    }
  }
  private async recordRawTimeInOut(
    employeeAccountId: string,
    timeInOut: RawTimeInOutResponse[],
  ): Promise<void> {
    await Promise.all(
      timeInOut.map(async (time) => {
        // check if the timeInOut already exists in the database then delete it
        await this.prisma.employeeTimekeepingRaw.deleteMany({
          where: {
            accountId: employeeAccountId,
            OR: [
              {
                timeIn: {
                  lte: time.timeOut,
                },
                timeOut: {
                  gte: time.timeIn,
                },
              },
            ],
          },
        });

        // calculate the time span in minutes
        const timeSpan = moment(time.timeOut).diff(
          moment(time.timeIn),
          'minutes',
          true,
        );

        // create the timekeeping raw data
        const insertParameters: Prisma.EmployeeTimekeepingRawCreateInput = {
          account: { connect: { id: employeeAccountId } },
          timeIn: time.timeIn,
          timeOut: time.timeOut,
          timeSpan: timeSpan,
        };

        await this.prisma.employeeTimekeepingRaw.create({
          data: insertParameters,
        });
      }),
    );
  }
  private async formatInOutData(
    body: TimeInOutDTO[],
  ): Promise<RawTimeInOutResponse[]> {
    // sort the timeInOut by timeIn
    body.sort(
      (a, b) => new Date(a.timeIn).getTime() - new Date(b.timeIn).getTime(),
    );

    // don't allow timeIn to be greater than timeOut
    body.forEach((time) => {
      if (new Date(time.timeIn) > new Date(time.timeOut)) {
        throw new BadRequestException(
          'Time In cannot be greater than Time Out',
        );
      }
    });

    // format the timeIn and timeOut to Date objects
    const formattedData = body.map((time) => ({
      timeIn: this.utilityService.manilaToUTC(time.timeIn),
      timeOut: this.utilityService.manilaToUTC(time.timeOut),
    }));

    return formattedData;
  }

  private async formatResponseTotalTimekeepingData(
    data: EmployeeData,
    cutoffDateRange: CutoffDateRange,
  ): Promise<EmployeeTimekeepingTotal> {
    const employeeInformation: EmployeeData =
      await this.prisma.employeeData.findUnique({
        where: { accountId: data.accountId },
      });
    const accountInformation: Account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });
    const firstName =
      this.utilityService.capitalizeFirstLetter(accountInformation.firstName) ||
      '';
    const lastName =
      this.utilityService.capitalizeFirstLetter(accountInformation.lastName) ||
      '';
    const middleName =
      this.utilityService.capitalizeFirstLetter(
        accountInformation.middleName,
      ) || '';
    const fullName = `${lastName}, ${firstName} ${middleName}`.trim();

    const employeeTimekeepingCutoff: EmployeeTimekeepingCutoff =
      await this.prisma.employeeTimekeepingCutoff.findUnique({
        where: {
          accountId_cutoffDateRangeId: {
            accountId: employeeInformation.accountId,
            cutoffDateRangeId: cutoffDateRange.id,
          },
        },
      });

    /* initialize data */
    let timekeepingData: TimekeepingDataResponse = {
      workTime: this.utilityService.formatHours(0),
      breakTime: this.utilityService.formatHours(0),
      undertime: this.utilityService.formatHours(0),
      late: this.utilityService.formatHours(0),
      overtime: this.utilityService.formatHours(0),
      overtimeApproved: this.utilityService.formatHours(0),
      overtimeForApproval: this.utilityService.formatHours(0),
      nightDifferential: this.utilityService.formatHours(0),
      nightDifferentialOvertime: this.utilityService.formatHours(0),
      nightDifferentialOvertimeForApproval: this.utilityService.formatHours(0),
      nightDifferentialOvertimeApproved: this.utilityService.formatHours(0),
      absentCount: 0,
      presentDayCount: 0,
      totalCreditedHours: this.utilityService.formatHours(0),
      specialHolidayCount: 0,
      regularHolidayCount: 0,
      totalHolidayCount: 0,
      workDayCount: 0,
      approvedLeaveCount: 0,
      approvedLeaveHours: this.utilityService.formatHours(0),
      leaveWithPayCount: 0,
      leaveWithoutPayCount: 0,
    };

    if (employeeTimekeepingCutoff) {
      timekeepingData = {
        workTime: this.utilityService.formatHours(
          employeeTimekeepingCutoff.workMinutes / 60,
        ),
        breakTime: this.utilityService.formatHours(
          employeeTimekeepingCutoff.breakMinutes / 60,
        ),
        undertime: this.utilityService.formatHours(
          employeeTimekeepingCutoff.undertimeMinutes / 60,
        ),
        late: this.utilityService.formatHours(
          employeeTimekeepingCutoff.lateMinutes / 60,
        ),
        overtime: this.utilityService.formatHours(
          employeeTimekeepingCutoff.overtimeMinutes / 60,
        ),
        overtimeApproved: this.utilityService.formatHours(
          employeeTimekeepingCutoff.overtimeMinutesApproved / 60,
        ),
        overtimeForApproval: this.utilityService.formatHours(
          employeeTimekeepingCutoff.overtimeMinutesForApproval / 60,
        ),
        nightDifferential: this.utilityService.formatHours(
          employeeTimekeepingCutoff.nightDifferentialMinutes / 60,
        ),
        nightDifferentialOvertime: this.utilityService.formatHours(
          employeeTimekeepingCutoff.nightDifferentialOvertimeMinutes / 60,
        ),
        nightDifferentialOvertimeForApproval: this.utilityService.formatHours(
          employeeTimekeepingCutoff.nightDifferentialOvertimeForApproval / 60,
        ),
        nightDifferentialOvertimeApproved: this.utilityService.formatHours(
          employeeTimekeepingCutoff.nightDifferentialOvertimeApproved / 60,
        ),
        absentCount: employeeTimekeepingCutoff.absentCount,
        presentDayCount: employeeTimekeepingCutoff.presentDayCount,
        totalCreditedHours: this.utilityService.formatHours(
          employeeTimekeepingCutoff.totalCreditedHours / 60,
        ),
        specialHolidayCount: employeeTimekeepingCutoff.specialHolidayCount,
        regularHolidayCount: employeeTimekeepingCutoff.regularHolidayCount,
        totalHolidayCount:
          employeeTimekeepingCutoff.specialHolidayCount +
          employeeTimekeepingCutoff.regularHolidayCount,
        workDayCount: employeeTimekeepingCutoff.workDayCount,
        approvedLeaveCount: 0,
        approvedLeaveHours: this.utilityService.formatHours(0),
        leaveWithPayCount: 0,
        leaveWithoutPayCount: 0,
      };

      // Get leave data if leave integration service is available
      try {
        if (!this.leaveTimekeepingIntegrationService) {
          this.leaveTimekeepingIntegrationService = this.moduleRef.get(
            LeaveTimekeepingIntegrationService,
            { strict: false },
          );
        }

        if (this.leaveTimekeepingIntegrationService) {
          const startDate = moment(cutoffDateRange.startDate).format(
            'YYYY-MM-DD',
          );
          const endDate = moment(cutoffDateRange.endDate).format('YYYY-MM-DD');
          const leaveSummary =
            await this.leaveTimekeepingIntegrationService.calculateLeaveSummary(
              data.accountId,
              startDate,
              endDate,
            );

          timekeepingData.approvedLeaveCount = leaveSummary.approvedLeaveCount;
          timekeepingData.approvedLeaveHours = leaveSummary.approvedLeaveHours;
          timekeepingData.leaveWithPayCount = leaveSummary.leaveWithPayCount;
          timekeepingData.leaveWithoutPayCount =
            leaveSummary.leaveWithoutPayCount;

          // Adjust absent count by subtracting approved leaves
          timekeepingData.absentCount = Math.max(
            0,
            timekeepingData.absentCount - leaveSummary.approvedLeaveCount,
          );
        }
      } catch (error) {
        console.error('Error getting leave data:', error);
      }
    }

    const employeeTimeekeepingTotal: EmployeeTimekeepingTotal = {
      employeeCode: employeeInformation.employeeCode,
      timekeepingCutoffId: employeeTimekeepingCutoff
        ? employeeTimekeepingCutoff.id
        : 0,
      employeeAccountInformation: {
        accountId: accountInformation.id,
        fullName,
        firstName,
        lastName,
        middleName,
      },
      timekeepingTotal: timekeepingData,
    };

    return employeeTimeekeepingTotal;
  }
  async getEmployeeTimekeepingByDate(
    params: RequestEmployeeTimekeepingByDate,
    isRetry = false,
  ): Promise<TimekeepingOutputResponse> {
    /* initialize default data */
    let response: TimekeepingOutputResponse = this.returnBlankOutputResponse(
      params.date,
    );

    const whereClause: any = {
      dateString: moment(params.date.raw).format('YYYY-MM-DD'),
      employeeTimekeepingCutoff: {
        accountId: params.employeeAccountId,
      },
    };

    // If cutoffDateRangeId is provided, filter by it to avoid overlapping cutoffs
    if (params.cutoffDateRangeId) {
      whereClause.employeeTimekeepingCutoff.cutoffDateRangeId = params.cutoffDateRangeId;
      this.utilityService.log(
        `[TIMEKEEPING] Filtering by cutoffDateRangeId: ${params.cutoffDateRangeId} for date: ${whereClause.dateString}`,
      );
    } else {
      this.utilityService.log(
        `[TIMEKEEPING] WARNING: No cutoffDateRangeId provided for date: ${whereClause.dateString}`,
      );
    }

    const timekeepingData: EmployeeTimekeeping =
      await this.prisma.employeeTimekeeping.findFirst({
        where: whereClause,
      });
    
    if (timekeepingData) {
      this.utilityService.log(
        `[TIMEKEEPING] Found timekeeping ID: ${timekeepingData.id} for date: ${whereClause.dateString}`,
      );
    }

    if (!timekeepingData && !isRetry) {
      await this.recompute({
        employeeAccountId: params.employeeAccountId,
        date: params.date.dateStandard,
      });

      return this.getEmployeeTimekeepingByDate(params, true);
    }

    if (!timekeepingData && isRetry) {
      // If still no data after recompute, return blank response
      this.utilityService.log(
        `Unable to create timekeeping record for employee ${params.employeeAccountId} on ${params.date.dateFull}`,
      );
      return response;
    }

    /* if there is time keeping data create response */
    if (timekeepingData) {
      let activeShift = null;

      /* get json data from active shift */
      try {
        activeShift = JSON.parse(
          timekeepingData.activeShiftConfig.toString(),
        ) as ShiftDataResponse;
      } catch (error) {
        activeShift = null;
      }

      /* get employee payroll group for grace periods */
      const employeeData = await this.prisma.employeeData.findUnique({
        where: { accountId: params.employeeAccountId },
        include: {
          payrollGroup: true,
        },
      });

      /* get breakdown for this timekeeping */
      const timeBreakdownRaw: EmployeeTimekeepingLogs[] =
        await this.prisma.employeeTimekeepingLogs.findMany({
          where: { timekeepingId: timekeepingData.id, isRaw: true },
        });
      const processedTimeBreakdownRaw: EmployeeTimekeepingLogs[] =
        await this.prisma.employeeTimekeepingLogs.findMany({
          where: {
            timekeepingId: timekeepingData.id,
            isRaw: false,
            isNextDayOverlap: false,
          },
        });
      const nextDayProcessedTimeBreakdownRaw: EmployeeTimekeepingLogs[] =
        await this.prisma.employeeTimekeepingLogs.findMany({
          where: {
            timekeepingId: timekeepingData.id,
            isRaw: false,
            isNextDayOverlap: true,
          },
        });
      const timekeepingOverrideData: EmployeeTimekeepingOverride =
        timekeepingData.overrideId
          ? await this.prisma.employeeTimekeepingOverride.findUnique({
              where: { id: timekeepingData.overrideId },
            })
          : null;
      const timekeepingComputedData: EmployeeTimekeepingComputed =
        await this.prisma.employeeTimekeepingComputed.findUnique({
          where: { timekeepingId: timekeepingData.id },
        });
      const timeBreakdown: TimeBreakdownResponse[] =
        this.formatTimeBreakdown(timeBreakdownRaw);
      const processedTimeBreakdown: TimeBreakdownResponse[] =
        this.formatTimeBreakdown(processedTimeBreakdownRaw);
      const nextDayProcessedTimeBreakdown: TimeBreakdownResponse[] =
        this.formatTimeBreakdown(nextDayProcessedTimeBreakdownRaw);
      const timeIn =
        timeBreakdown.length > 0 ? timeBreakdown[0].timeIn.time : '-';
      const timeOut =
        timeBreakdown.length > 0
          ? timeBreakdown[timeBreakdown.length - 1].timeOut.time
          : '-';
      const timekeepingHoliday: EmployeeTimekeepingHoliday[] =
        await this.prisma.employeeTimekeepingHoliday.findMany({
          where: { timekeepingId: timekeepingData.id },
        });
      const holidayList: TimekeepingHoliday[] = timekeepingHoliday.map(
        (holiday) => {
          return {
            name: holiday.name,
            holidayType: HolidayTypeReference.find(
              (type) => type.key === holiday.holidayType,
            ),
            source: holiday.source,
          };
        },
      );

      const timekeepingOverride: TimekeepingOverrideResponse = {
        worktime: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.workMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        nightDifferential: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.nightDifferentialMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        nightDifferentialOvertime: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.nightDifferentialOvertimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        overtime: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.overtimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        late: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.lateMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        undertime: timekeepingOverrideData
          ? this.utilityService.formatHours(
              timekeepingOverrideData.undertimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
      };

      const timekeepingComputed: TimekeepingComputedResponse = {
        worktime: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.workMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        breakTime: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.breakMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        nightDifferential: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.nightDifferentialMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        nightDifferentialOvertime: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.nightDifferentialOvertimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        overtime: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.overtimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        late: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.lateMinutes / 60,
            )
          : this.utilityService.formatHours(0),
        undertime: timekeepingComputedData
          ? this.utilityService.formatHours(
              timekeepingComputedData.undertimeMinutes / 60,
            )
          : this.utilityService.formatHours(0),
      };

      const totalWorkTimeWithOverride =
        timekeepingData.workMinutes +
        (timekeepingOverrideData ? timekeepingOverrideData.workMinutes : 0);

      // Check for approved leave on this date
      let hasApprovedLeave = false;
      let leaveType = '';
      let leaveCompensationType = '';

      try {
        if (!this.leaveTimekeepingIntegrationService) {
          this.leaveTimekeepingIntegrationService = this.moduleRef.get(
            LeaveTimekeepingIntegrationService,
            { strict: false },
          );
        }

        if (this.leaveTimekeepingIntegrationService) {
          const checkDate = moment(params.date.raw).format('YYYY-MM-DD');
          this.utilityService.log(
            `Checking leave for employee ${params.employeeAccountId} on ${checkDate}`,
          );

          const leaveData =
            await this.leaveTimekeepingIntegrationService.getLeaveForDate(
              params.employeeAccountId,
              checkDate,
            );

          if (leaveData) {
            hasApprovedLeave = true;
            const leaveInfo = leaveData.leaveData as any;
            leaveType = leaveInfo?.leaveType || '';
            leaveCompensationType = leaveInfo?.compensationType || '';
            this.utilityService.log(
              `Found approved leave: ${leaveType} (${leaveCompensationType}) for ${params.employeeAccountId} on ${checkDate}`,
            );
          } else {
            this.utilityService.log(
              `No approved leave found for ${params.employeeAccountId} on ${checkDate}`,
            );
          }
        } else {
          this.utilityService.log(
            'LeaveTimekeepingIntegrationService not available',
          );
        }
      } catch (error) {
        console.error('Error checking leave status for date:', error);
        this.utilityService.log(`Error checking leave: ${error.message}`);
      }

      /* calculate grace period info */
      let gracePeriods: GracePeriodInfo = null;
      if (employeeData?.payrollGroup && timekeepingComputedData) {
        const payrollGroup = employeeData.payrollGroup;

        // Use the new raw values to check if grace periods were applied
        const rawLateMinutes =
          (timekeepingComputedData as any).rawLateMinutes || 0;
        const adjustedLateMinutes = timekeepingComputedData.lateMinutes || 0;
        // For threshold-based grace: if raw > 0 but adjusted = 0, grace was applied
        const lateGraceApplied =
          rawLateMinutes > 0 && adjustedLateMinutes === 0;
        const lateMinutesForgiven = lateGraceApplied ? rawLateMinutes : 0;

        const rawUndertimeMinutes =
          (timekeepingComputedData as any).rawUndertimeMinutes || 0;
        const adjustedUndertimeMinutes =
          timekeepingComputedData.undertimeMinutes || 0;
        const undertimeGraceApplied =
          rawUndertimeMinutes > 0 && adjustedUndertimeMinutes === 0;
        const undertimeMinutesForgiven = undertimeGraceApplied
          ? rawUndertimeMinutes
          : 0;

        const rawOvertimeMinutes =
          (timekeepingComputedData as any).rawOvertimeMinutes || 0;
        const adjustedOvertimeMinutes =
          timekeepingComputedData.overtimeMinutes || 0;
        const overtimeGraceApplied =
          rawOvertimeMinutes > 0 && adjustedOvertimeMinutes === 0;
        const overtimeMinutesAdjusted = overtimeGraceApplied
          ? rawOvertimeMinutes
          : 0;

        gracePeriods = {
          lateGraceTimeMinutes: payrollGroup.lateGraceTimeMinutes,
          undertimeGraceTimeMinutes: payrollGroup.undertimeGraceTimeMinutes,
          overtimeGraceTimeMinutes: payrollGroup.overtimeGraceTimeMinutes,
          lateGraceApplied,
          undertimeGraceApplied,
          overtimeGraceApplied,
          lateMinutesForgiven,
          undertimeMinutesForgiven,
          overtimeMinutesAdjusted,
        };
      }

      /* create response data */
      response = {
        date: params.date.dateFull,
        dateFormatted: params.date,
        timekeepingId: timekeepingData.id,
        timeIn,
        timeOut,
        dayDetails: {
          isExtraDay: timekeepingData.isExtraDay || false,
          isRestDay: timekeepingData.isRestDay || false,
          isDayApproved: timekeepingData.isDayApproved || false,
          isDayForApproval:
            !timekeepingData.isDayApproved && totalWorkTimeWithOverride > 0
              ? false
              : true,
          specialHolidayCount: timekeepingData.specialHolidayCount || 0,
          regularHolidayCount: timekeepingData.regularHolidayCount || 0,
          isEligibleHoliday: timekeepingData.isEligibleHoliday ?? true,
          isEligibleHolidayOverride:
            timekeepingData.isEligibleHolidayOverride ?? null,
          hasApprovedLeave,
          leaveType,
          leaveCompensationType,
        },
        activeShiftType: ActiveShiftTypeReference.find(
          (shift) => shift.key === timekeepingData.activeShiftType,
        ),
        activeShift: activeShift,
        timekeepingSummary: {
          /* computed groups */
          worktime: this.utilityService.formatHours(
            timekeepingData.workMinutes / 60,
          ),
          breaktime: this.utilityService.formatHours(
            timekeepingData.breakMinutes / 60,
          ),
          overtime: this.utilityService.formatHours(
            timekeepingData.overtimeMinutes / 60,
          ),
          overtimeApproved: this.utilityService.formatHours(
            timekeepingData.overtimeMinutesApproved / 60,
          ),
          overtimeForApproval: this.utilityService.formatHours(
            timekeepingData.overtimeMinutesForApproval / 60,
          ),
          undertime: this.utilityService.formatHours(
            timekeepingData.undertimeMinutes / 60,
          ),
          late: this.utilityService.formatHours(
            timekeepingData.lateMinutes / 60,
          ),
          nightDifferential: this.utilityService.formatHours(
            timekeepingData.nightDifferentialMinutes / 60,
          ),
          nightDifferentialOvertime: this.utilityService.formatHours(
            timekeepingData.nightDifferentialOvertimeMinutes / 60,
          ),
          nightDifferentialOvertimeApproved: this.utilityService.formatHours(
            timekeepingData.nightDifferentialOvertimeApproved / 60,
          ),
          nightDifferentialOvertimeForApproval: this.utilityService.formatHours(
            timekeepingData.nightDifferentialOvertimeForApproval / 60,
          ),

          /* summary groups */
          absentCount: timekeepingData.absentCount,
          presentDayCount: timekeepingData.presentDayCount,
          totalCreditedHours: this.utilityService.formatHours(
            timekeepingData.totalCreditedHours / 60,
          ),

          /* holiday */
          specialHolidayCount: timekeepingData.specialHolidayCount,
          regularHolidayCount: timekeepingData.regularHolidayCount,
          totalHolidayCount:
            timekeepingData.specialHolidayCount +
            timekeepingData.regularHolidayCount,

          /* leave data */
          approvedLeaveCount: hasApprovedLeave ? 1 : 0,
          approvedLeaveHours:
            hasApprovedLeave && activeShift
              ? this.utilityService.formatHours(
                  activeShift.totalWorkHours?.raw || 8,
                )
              : this.utilityService.formatHours(0),
          leaveWithPayCount:
            hasApprovedLeave && leaveCompensationType === 'WITH_PAY' ? 1 : 0,
          leaveWithoutPayCount:
            hasApprovedLeave && leaveCompensationType === 'WITHOUT_PAY' ? 1 : 0,

          /* absent reason */
          absentReason:
            hasApprovedLeave && leaveCompensationType === 'WITHOUT_PAY'
              ? 'ON_LEAVE'
              : timekeepingData.absentCount > 0
                ? 'ABSENT'
                : undefined,
        },
        timekeepingComputed,
        isOverridden: timekeepingData.overrideId ? true : false,
        timekeepingOverride: timekeepingOverride,
        timeBreakdown,
        processedTimeBreakdown,
        holidayList,
        nextDayProcessedTimeBreakdown,
        gracePeriods,
      };
    }

    return response;
  }
  private formatTimeBreakdown(
    timeBreakdown: EmployeeTimekeepingLogs[],
  ): TimeBreakdownResponse[] {
    const formattedTimeBreakdown: TimeBreakdownResponse[] = timeBreakdown.map(
      (time) => {
        return {
          timeIn: this.utilityService.formatTime(time.timeIn),
          timeOut: this.utilityService.formatTime(time.timeOut),
          hours: this.utilityService.formatHours(time.timeSpan / 60),
          breakdownType: time.type,
          breakdownTypeDetails: BreakdownTypeReference.find(
            (breakdown) => breakdown.key === time.type,
          ),
        };
      },
    );

    // sort the timeBreakdown by timeIn
    formattedTimeBreakdown.sort(
      (a, b) =>
        new Date(a.timeIn.minutes).getTime() -
        new Date(b.timeIn.minutes).getTime(),
    );

    return formattedTimeBreakdown;
  }

  private returnBlankOutputResponse(date): TimekeepingOutputResponse {
    return {
      date: '',
      dateFormatted: date,
      timekeepingId: 0,
      timeIn: '-',
      timeOut: '-',
      dayDetails: {
        isExtraDay: false,
        isRestDay: false,
        isDayApproved: true,
        isDayForApproval: false,
        specialHolidayCount: 0,
        regularHolidayCount: 0,
        isEligibleHoliday: true,
        isEligibleHolidayOverride: null,
        hasApprovedLeave: false,
        leaveType: '',
        leaveCompensationType: '',
      },
      activeShiftType: ActiveShiftTypeReference.find(
        (shift) => shift.key === ActiveShiftType.NONE,
      ),
      activeShift: null,
      timekeepingSummary: {
        worktime: this.utilityService.formatHours(0),
        breaktime: this.utilityService.formatHours(0),
        overtime: this.utilityService.formatHours(0),
        overtimeForApproval: this.utilityService.formatHours(0),
        overtimeApproved: this.utilityService.formatHours(0),
        undertime: this.utilityService.formatHours(0),
        late: this.utilityService.formatHours(0),
        nightDifferential: this.utilityService.formatHours(0),
        nightDifferentialOvertime: this.utilityService.formatHours(0),
        nightDifferentialOvertimeApproved: this.utilityService.formatHours(0),
        nightDifferentialOvertimeForApproval:
          this.utilityService.formatHours(0),
        absentCount: 0,
        presentDayCount: 0,
        totalCreditedHours: this.utilityService.formatHours(0),
        specialHolidayCount: 0,
        regularHolidayCount: 0,
        totalHolidayCount: 0,
        approvedLeaveCount: 0,
        approvedLeaveHours: this.utilityService.formatHours(0),
        leaveWithPayCount: 0,
        leaveWithoutPayCount: 0,
        absentReason: undefined,
      },
      isOverridden: true,
      timekeepingOverride: {
        worktime: this.utilityService.formatHours(0),
        nightDifferential: this.utilityService.formatHours(0),
        nightDifferentialOvertime: this.utilityService.formatHours(0),
        overtime: this.utilityService.formatHours(0),
        late: this.utilityService.formatHours(0),
        undertime: this.utilityService.formatHours(0),
      },
      timekeepingComputed: {
        worktime: this.utilityService.formatHours(0),
        breakTime: this.utilityService.formatHours(0),
        nightDifferential: this.utilityService.formatHours(0),
        nightDifferentialOvertime: this.utilityService.formatHours(0),
        overtime: this.utilityService.formatHours(0),
        late: this.utilityService.formatHours(0),
        undertime: this.utilityService.formatHours(0),
      },
      timeBreakdown: [],
      processedTimeBreakdown: [],
      holidayList: [],
      nextDayProcessedTimeBreakdown: [],
    };
  }

  private returBlankTimekeepingData(): TimekeepingDataResponse {
    return {
      workTime: this.utilityService.formatHours(0),
      breakTime: this.utilityService.formatHours(0),
      undertime: this.utilityService.formatHours(0),
      late: this.utilityService.formatHours(0),
      overtime: this.utilityService.formatHours(0),
      overtimeApproved: this.utilityService.formatHours(0),
      overtimeForApproval: this.utilityService.formatHours(0),
      nightDifferential: this.utilityService.formatHours(0),
      nightDifferentialOvertime: this.utilityService.formatHours(0),
      nightDifferentialOvertimeApproved: this.utilityService.formatHours(0),
      nightDifferentialOvertimeForApproval: this.utilityService.formatHours(0),
      absentCount: 0,
      presentDayCount: 0,
      totalCreditedHours: this.utilityService.formatHours(0),
      specialHolidayCount: 0,
      regularHolidayCount: 0,
      totalHolidayCount: 0,
      workDayCount: 0,
      approvedLeaveCount: 0,
      approvedLeaveHours: this.utilityService.formatHours(0),
      leaveWithPayCount: 0,
      leaveWithoutPayCount: 0,
    };
  }

  private async formatLogResponse(
    data: EmployeeTimekeepingRaw,
  ): Promise<TimekeepingLogResponse> {
    const response: TimekeepingLogResponse = {
      id: data.id,
      timeIn: this.utilityService.formatDate(data.timeIn),
      timeOut: this.utilityService.formatDate(data.timeOut),
      timeSpan: this.utilityService.formatHours(data.timeSpan / 60),
      source: TimeekeepingSourceReference.find(
        (source) => source.key === data.source,
      ),
      createdAt: this.utilityService.formatDate(data.createdAt),
    };
    return response;
  }

  async recomputeAllTimekeeping(
    params: RecomputeAllTimekeepingRequest,
  ): Promise<{ queueId: string }> {
    const cutoffDateRange: CutoffDateRange =
      await this.prisma.cutoffDateRange.findUnique({
        where: { id: params.cutoffDateRangeId },
      });
    const startDate = this.utilityService.formatDate(cutoffDateRange.startDate);
    const endDate = this.utilityService.formatDate(cutoffDateRange.endDate);
    this.utilityService.log(
      `Recomputing all timekeeping for Cutoff (${cutoffDateRange.id}) from ${startDate.dateFull} to ${endDate.dateFull}`,
    );

    const queue = await this.queueService.createQueue({
      name: `Timekeeping processing for ${startDate.dateFull} to ${endDate.dateFull}`,
      type: QueueType.TIMEKEEPING_PROCESSING,
      queueSettings: {
        cutoffDateRangeId: cutoffDateRange.id,
      },
    });

    const paramUpdateCutoffDateRange: Prisma.CutoffDateRangeUpdateInput = {
      timekeepingProcessingQueueId: queue.id,
    };

    await this.prisma.cutoffDateRange.update({
      where: { id: cutoffDateRange.id },
      data: paramUpdateCutoffDateRange,
    });

    return { queueId: queue.id };
  }

  async submitForPayrollProcessing(params: SubmitForPayrollProcessingRequest) {
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: params.cutoffDateRangeId },
    });

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    const paramUpdateCutoffDateRange: Prisma.CutoffDateRangeUpdateInput = {
      status: CutoffDateRangeStatus.PENDING,
    };

    /* queue */
    const dateStart = this.utilityService.formatDate(cutoffDateRange.startDate);
    const dateEnd = this.utilityService.formatDate(cutoffDateRange.endDate);
    const queue = await this.queueService.createQueue({
      name: `Payroll processing for ${dateStart.dateFull} to ${dateEnd.dateFull}`,
      type: QueueType.PAYROLL_PROCESSING,
      queueSettings: {
        cutoffDateRangeId: cutoffDateRange.id,
      },
    });

    /* update queue id */
    paramUpdateCutoffDateRange.payrollProcessingQueueId = queue.id;

    await this.prisma.cutoffDateRange.update({
      where: { id: cutoffDateRange.id },
      data: paramUpdateCutoffDateRange,
    });
    return { queueId: queue.id };
  }

  async getActiveBranchesForCutoff(
    cutoffDateRangeId: string,
  ): Promise<number[]> {
    // Get distinct branch IDs that have employees in this cutoff
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: cutoffDateRangeId },
    });

    if (!cutoffDateRange) {
      throw new BadRequestException('Cutoff date range not found');
    }

    const employeesInCutoff = await this.prisma.employeeData.findMany({
      where: {
        payrollGroup: {
          cutoffId: cutoffDateRange.cutoffId,
        },
        account: {
          companyId: this.utilityService.companyId,
        },
      },
      select: {
        branchId: true,
      },
      distinct: ['branchId'],
    });

    return employeesInCutoff.map((e) => e.branchId);
  }

  async getBranchTimekeepingStatus(cutoffDateRangeId: string) {
    const activeBranches =
      await this.getActiveBranchesForCutoff(cutoffDateRangeId);

    // Get branch status for all active branches
    const branchStatuses = await this.prisma.branchTimekeepingStatus.findMany({
      where: {
        cutoffDateRangeId,
        branchId: {
          in: activeBranches,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        markedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get branch details for branches without status
    const branchesWithStatus = branchStatuses.map((bs) => bs.branchId);
    const branchesWithoutStatus = activeBranches.filter(
      (branchId) => !branchesWithStatus.includes(branchId),
    );

    const missingBranches = await this.prisma.project.findMany({
      where: {
        id: {
          in: branchesWithoutStatus,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Combine all branch information
    const allBranches = [
      ...branchStatuses.map((bs) => ({
        branchId: bs.branchId,
        branchName: bs.branch.name,
        isReady: bs.isReady,
        markedReadyBy: bs.markedBy
          ? `${bs.markedBy.firstName} ${bs.markedBy.lastName}`
          : null,
        markedReadyAt: bs.markedReadyAt,
      })),
      ...missingBranches.map((branch) => ({
        branchId: branch.id,
        branchName: branch.name,
        isReady: false,
        markedReadyBy: null,
        markedReadyAt: null,
      })),
    ];

    const readyCount = allBranches.filter((b) => b.isReady).length;
    const totalCount = allBranches.length;

    return {
      totalBranches: totalCount,
      readyBranches: readyCount,
      branches: allBranches,
      allReady: readyCount === totalCount,
    };
  }

  async markBranchTimekeepingReady(cutoffDateRangeId: string): Promise<void> {
    const userBranchId = await this.utilityService.getUserBranchId();

    if (!userBranchId) {
      throw new BadRequestException('User does not have a branch assigned');
    }

    const accountId = this.utilityService.accountInformation.id;

    await this.prisma.branchTimekeepingStatus.upsert({
      where: {
        branchId_cutoffDateRangeId: {
          branchId: userBranchId,
          cutoffDateRangeId,
        },
      },
      update: {
        isReady: true,
        markedReadyBy: accountId,
        markedReadyAt: new Date(),
      },
      create: {
        branchId: userBranchId,
        cutoffDateRangeId,
        isReady: true,
        markedReadyBy: accountId,
        markedReadyAt: new Date(),
      },
    });
  }

  async getTimekeepingBranches() {
    // Get all branches (Projects with status BRANCH)
    const branches = await this.prisma.project.findMany({
      where: {
        status: 'BRANCH',
        isDeleted: false,
        companyId: this.utilityService.companyId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return branches.map((branch) => ({
      value: branch.id,
      label: `${branch.code} - ${branch.name}`,
      code: branch.code,
      name: branch.name,
    }));
  }

  async getDailyAttendanceSummary(
    date?: string,
    branchId?: number,
  ): Promise<{
    date: string;
    attendance: {
      present: number;
      late: number;
      undertime: number;
      absent: number;
      onLeave: number;
    };
    totalActiveEmployees: number;
    leavesThisMonth: number;
  }> {
    // Use today's date if not provided
    const targetDate = date
      ? moment(date).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    // Get the start and end of the month for leaves calculation
    const monthStart = moment(targetDate).startOf('month').toDate();
    const monthEnd = moment(targetDate).endOf('month').toDate();

    // Get active employees count
    const activeEmployeesQuery: Prisma.AccountWhereInput = {
      isDeleted: false,
      EmployeeData: {
        isActive: true,
        ...(branchId && { branchId }),
      },
    };

    const totalActiveEmployees = await this.prisma.account.count({
      where: activeEmployeesQuery,
    });

    // Get attendance data for the specific date
    const timekeepingData = await this.prisma.employeeTimekeeping.findMany({
      where: {
        dateString: targetDate,
        employeeTimekeepingCutoff: {
          account: activeEmployeesQuery,
        },
      },
      include: {
        employeeTimekeepingCutoff: {
          include: {
            account: {
              include: {
                EmployeeData: true,
              },
            },
          },
        },
        EmployeeTimekeepingComputed: true,
      },
    });

    // Initialize counters
    const attendance = {
      present: 0,
      late: 0,
      undertime: 0,
      absent: 0,
      onLeave: 0,
    };

    // Count attendance statuses
    for (const record of timekeepingData) {
      // Check if this is a work day
      if (record.workDayCount === 0) continue;

      // Get computed data if available (for future use)
      const _computed = record.EmployeeTimekeepingComputed?.[0];

      // Check attendance status
      if (record.absentCount > 0) {
        attendance.absent++;
      } else if (record.presentDayCount > 0) {
        attendance.present++;

        // Check for late
        if (record.lateMinutes > 0) {
          attendance.late++;
        }

        // Check for undertime
        if (record.undertimeMinutes > 0) {
          attendance.undertime++;
        }
      }

      // Check for leaves (separate check as employee might have partial day leave)
      const hasFullDayLeave = await this.checkForFullDayLeave(
        record.employeeTimekeepingCutoff.accountId,
        targetDate,
      );
      if (hasFullDayLeave) {
        attendance.onLeave++;
        // Adjust present count if needed
        if (record.presentDayCount > 0) {
          attendance.present--;
        }
      }
    }

    // Get approved leaves count for this month
    const { PayrollFilingType, PayrollFilingStatus } = await import(
      '@prisma/client'
    );
    const leavesThisMonth = await this.prisma.payrollFiling.count({
      where: {
        filingType: PayrollFilingType.LEAVE,
        status: PayrollFilingStatus.APPROVED,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        account: activeEmployeesQuery,
      },
    });

    return {
      date: targetDate,
      attendance,
      totalActiveEmployees,
      leavesThisMonth,
    };
  }

  private async checkForFullDayLeave(
    accountId: string,
    dateString: string,
  ): Promise<boolean> {
    const { PayrollFilingType, PayrollFilingStatus } = await import(
      '@prisma/client'
    );
    const filing = await this.prisma.payrollFiling.findFirst({
      where: {
        accountId,
        date: moment(dateString).toDate(),
        filingType: PayrollFilingType.LEAVE,
        status: PayrollFilingStatus.APPROVED,
        hours: { gte: 8 }, // 8 hours = full day
      },
    });

    return !!filing;
  }
}
