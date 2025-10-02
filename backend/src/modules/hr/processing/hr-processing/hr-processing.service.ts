import { Injectable, Inject } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '@common/prisma.service';
import { ProcessSingleEmployeeDTO } from './hr-processing.interface';
import {
  CutoffDateRangeStatus,
  EmployeeSalaryComputation,
  EmployeeSalaryComputationPerDay,
  EmployeeTimekeepingCutoff,
  QueueType,
} from '@prisma/client';
import * as ExcelJS from 'exceljs';
import {
  PayrollSummaryTotalsResponse,
  PayrollSummaryListItem,
} from '../../../../shared/response/payroll-processing.response';
import { PayrollProcessingService } from '@modules/hr/computation/hris-computation/payroll-processing/payroll-processing.service';
import {
  CutoffDateRangeResponse,
  CutoffListCountResponse,
  EmployeeSalaryComputationDeductionsResponse,
  PayrollProcessingDayResponse,
  PayrollProcessingResponse,
  SalaryInformationListResponse,
} from '../../../../shared/response';
import SalaryRateTypeReference from '../../../../reference/salary-rate-type.reference';
import { CutoffTypeReference } from '../../../../reference/cutoff.reference';
import DeductionBasisReference from '../../../../reference/deduction-basis.reference';
import DeductionPeriodReference from '../../../../reference/deduction-period.reference';
import { CutoffConfigurationService } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { QueueService } from '@infrastructure/queue/queue/queue.service';
import { DeductionPlanConfigurationService } from '@modules/hr/configuration/deduction-configuration/deduction-plan-configuration/deduction-plan-configuration.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { PostedPayrollService } from '../posted-payroll/posted-payroll.service';
import { GovernmentPaymentType } from '@prisma/client';
import { ApprovalService } from '@modules/approval/approval.service';
import { PayrollApproversService } from '@modules/hr/configuration/payroll-approvers/payroll-approvers.service';
import { LeaveTimekeepingIntegrationService } from '@modules/hr/filing/services/leave-timekeeping-integration.service';
import { PayrollApprovalStrategy } from '../strategies/payroll-approval.strategy';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';

@Injectable()
export class HrProcessingService {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly moduleRef: ModuleRef;
  @Inject() private readonly prismaService: PrismaService;
  @Inject()
  private readonly cutoffConfigurationService: CutoffConfigurationService;
  @Inject() private readonly employeeListService: EmployeeListService;
  @Inject() private readonly queueService: QueueService;
  @Inject()
  private readonly deductionPlanConfigurationService: DeductionPlanConfigurationService;
  @Inject() private readonly socketService: SocketService;
  @Inject() private readonly postedPayrollService: PostedPayrollService;
  @Inject() private readonly approvalService: ApprovalService;
  @Inject() private readonly payrollApproversService: PayrollApproversService;
  @Inject() private readonly payrollApprovalStrategy: PayrollApprovalStrategy;
  @Inject() private readonly notificationService: NotificationService;

  async countCutoffListByStatus(): Promise<CutoffListCountResponse> {
    const countPending = await this.prismaService.cutoffDateRange.count({
      where: {
        cutoff: {
          companyId: this.utilityService.companyId,
        },
        status: CutoffDateRangeStatus.PENDING,
      },
    });

    const countProcessed = await this.prismaService.cutoffDateRange.count({
      where: {
        cutoff: {
          companyId: this.utilityService.companyId,
        },
        status: CutoffDateRangeStatus.PROCESSED,
      },
    });

    const countApproved = await this.prismaService.cutoffDateRange.count({
      where: {
        cutoff: {
          companyId: this.utilityService.companyId,
        },
        status: CutoffDateRangeStatus.APPROVED,
      },
    });

    const countRejected = await this.prismaService.cutoffDateRange.count({
      where: {
        cutoff: {
          companyId: this.utilityService.companyId,
        },
        status: CutoffDateRangeStatus.REJECTED,
      },
    });

    const response: CutoffListCountResponse = {
      pending: countPending,
      processed: countProcessed,
      approved: countApproved,
      rejected: countRejected,
    };

    return response;
  }

  async getEmployeeSalaryComputationDeductions(
    employeeTimekeepingCutoffId: number,
  ): Promise<EmployeeSalaryComputationDeductionsResponse[]> {
    employeeTimekeepingCutoffId = Number(employeeTimekeepingCutoffId);
    const employeeSalaryComputationDeductions =
      await this.prismaService.employeeSalaryComputationDeductions.findMany({
        where: {
          employeeSalaryComputationId: employeeTimekeepingCutoffId,
        },
      });

    const response: EmployeeSalaryComputationDeductionsResponse[] =
      await Promise.all(
        employeeSalaryComputationDeductions.map(async (deduction) => {
          const deductionPlan =
            await this.deductionPlanConfigurationService.getById(
              deduction.deductionPlanId,
            );
          return {
            deductionPlan: deductionPlan,
            amount: deduction.amount,
          };
        }),
      );

    // Filter out inactive deduction plans
    const activeDeductions = response.filter(
      (item) => item.deductionPlan && item.deductionPlan.isActive === true,
    );

    return activeDeductions;
  }

  async getEmployeeSalaryComputationAllowances(
    employeeTimekeepingCutoffId: number,
  ): Promise<any[]> {
    employeeTimekeepingCutoffId = Number(employeeTimekeepingCutoffId);
    const employeeSalaryComputationAllowances =
      await this.prismaService.employeeSalaryComputationAllowances.findMany({
        where: {
          employeeSalaryComputationId: employeeTimekeepingCutoffId,
        },
        include: {
          allowancePlan: {
            include: {
              allowanceConfiguration: true,
            },
          },
        },
      });

    const response = employeeSalaryComputationAllowances.map((allowance) => {
      return {
        allowancePlan: allowance.allowancePlan,
        amount: allowance.amount,
      };
    });

    return response;
  }

  async getCutoffList(params: {
    status: CutoffDateRangeStatus;
  }): Promise<CutoffDateRangeResponse[]> {
    return await this.cutoffConfigurationService.getDateRangeList(
      params.status,
    );
  }
  async processSingleEmployee(body: ProcessSingleEmployeeDTO) {
    const payrollProcessingService = await this.moduleRef.create(
      PayrollProcessingService,
    );
    payrollProcessingService.setTimekeepingCutoffId(body.timekeepingCutoffId);
    await payrollProcessingService.computeSalary();
  }
  async getEmployeeListByCutoff(
    cutoffDateRangeId: string,
  ): Promise<SalaryInformationListResponse[]> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: {
          id: cutoffDateRangeId,
        },
        include: {
          cutoff: true,
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    const employeeTimekeepingCutoff: EmployeeTimekeepingCutoff[] =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: {
          cutoffDateRangeId: cutoffDateRangeId,
        },
      });

    const response: SalaryInformationListResponse[] = await Promise.all(
      employeeTimekeepingCutoff.map(async (employee) => {
        const employeeInformation = await this.employeeListService.info(
          employee.accountId,
        );
        const salaryComputation = await this.getEmployeeSalaryComputation(
          employee.id,
        );
        return { employeeInformation, salaryComputation };
      }),
    );

    return response;
  }

  async getEmployeeListByCutoffPaginated(
    cutoffDateRangeId: string,
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'fullName',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    data: SalaryInformationListResponse[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: {
          id: cutoffDateRangeId,
        },
        include: {
          cutoff: true,
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Build where clause with search
    const whereClause: any = {
      cutoffDateRangeId: cutoffDateRangeId,
    };

    if (search) {
      whereClause.account = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          {
            EmployeeData: {
              employeeCode: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    // Count total items
    const totalItems = await this.prismaService.employeeTimekeepingCutoff.count(
      {
        where: whereClause,
      },
    );

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'employeeCode':
        orderBy = { account: { EmployeeData: { employeeCode: sortOrder } } };
        break;
      case 'email':
        orderBy = { account: { email: sortOrder } };
        break;
      case 'username':
        orderBy = { account: { username: sortOrder } };
        break;
      case 'branch':
        orderBy = { account: { Branch: { name: sortOrder } } };
        break;
      case 'payrollGroup':
        orderBy = {
          account: {
            EmployeeData: { PayrollGroup: { payrollGroup: sortOrder } },
          },
        };
        break;
      // Salary computation fields
      case 'basicSalary':
        orderBy = { EmployeeSalaryComputation: { basicSalary: sortOrder } };
        break;
      case 'deductionLate':
        orderBy = { EmployeeSalaryComputation: { deductionLate: sortOrder } };
        break;
      case 'deductionUndertime':
        orderBy = {
          EmployeeSalaryComputation: { deductionUndertime: sortOrder },
        };
        break;
      case 'deductionAbsent':
        orderBy = { EmployeeSalaryComputation: { deductionAbsent: sortOrder } };
        break;
      case 'basicPay':
        orderBy = { EmployeeSalaryComputation: { basicPay: sortOrder } };
        break;
      case 'allowance':
        orderBy = { EmployeeSalaryComputation: { allowance: sortOrder } };
        break;
      case 'earningRegularHoliday':
        orderBy = {
          EmployeeSalaryComputation: { earningRegularHoliday: sortOrder },
        };
        break;
      case 'earningOvertime':
        orderBy = { EmployeeSalaryComputation: { earningOvertime: sortOrder } };
        break;
      case 'earningNightDifferential':
        orderBy = {
          EmployeeSalaryComputation: { earningNightDifferential: sortOrder },
        };
        break;
      case 'earningRestDay':
        orderBy = { EmployeeSalaryComputation: { earningRestDay: sortOrder } };
        break;
      case 'earningSalaryAdjustment':
        orderBy = {
          EmployeeSalaryComputation: { earningSalaryAdjustment: sortOrder },
        };
        break;
      case 'grossPay':
        orderBy = { EmployeeSalaryComputation: { grossPay: sortOrder } };
        break;
      case 'governmentContributionSSS':
        orderBy = {
          EmployeeSalaryComputation: { governmentContributionSSS: sortOrder },
        };
        break;
      case 'governmentContributionPhilhealth':
        orderBy = {
          EmployeeSalaryComputation: {
            governmentContributionPhilhealth: sortOrder,
          },
        };
        break;
      case 'governmentContributionPagibig':
        orderBy = {
          EmployeeSalaryComputation: {
            governmentContributionPagibig: sortOrder,
          },
        };
        break;
      case 'governmentContributionTax':
        orderBy = {
          EmployeeSalaryComputation: { governmentContributionTax: sortOrder },
        };
        break;
      case 'loans':
        orderBy = { EmployeeSalaryComputation: { loans: sortOrder } };
        break;
      case 'totalDeduction':
        orderBy = { EmployeeSalaryComputation: { totalDeduction: sortOrder } };
        break;
      case 'netPay':
        orderBy = { EmployeeSalaryComputation: { netPay: sortOrder } };
        break;
      case 'fullName':
      default:
        orderBy = [
          { account: { lastName: sortOrder } },
          { account: { firstName: sortOrder } },
        ];
        break;
    }

    // Get paginated employee timekeeping cutoffs
    const employeeTimekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      });

    // Process the data using existing methods to get employee info and salary computation
    const data: SalaryInformationListResponse[] = await Promise.all(
      employeeTimekeepingCutoffs.map(async (etc) => {
        const employeeInformation = await this.employeeListService.info(
          etc.accountId,
        );
        const salaryComputation = await this.getEmployeeSalaryComputation(
          etc.id,
        );
        return { employeeInformation, salaryComputation };
      }),
    );

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getPayrollSummaryOptimized(
    cutoffDateRangeId: string,
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'fullName',
    sortOrder: 'asc' | 'desc' = 'asc',
    branchIds?: number[],
    employmentStatusId?: string,
    departmentId?: string,
    roleId?: string,
  ): Promise<{
    data: PayrollSummaryListItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    // Validate cutoff exists
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: {
          id: cutoffDateRangeId,
        },
        include: {
          cutoff: true,
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Build where clause with search and filters
    const whereClause: any = {
      cutoffDateRangeId: cutoffDateRangeId,
    };

    // Build account conditions
    const accountConditions: any = {};
    const orConditions: any[] = [];

    if (search) {
      orConditions.push(
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          EmployeeData: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
      );
    }

    // Add filter conditions
    if (branchIds && branchIds.length > 0) {
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        branchId: {
          in: branchIds,
        },
      };
    }

    if (employmentStatusId) {
      // Employment status is in the EmployeeContract, not EmployeeData
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        activeContract: {
          employmentStatus: employmentStatusId,
        },
      };
    }

    if (departmentId) {
      accountConditions.role = {
        ...accountConditions.role,
        roleGroupId: departmentId,
      };
    }

    if (roleId) {
      accountConditions.roleId = roleId;
    }

    // Combine conditions
    if (orConditions.length > 0 && Object.keys(accountConditions).length > 0) {
      whereClause.account = {
        AND: [{ OR: orConditions }, accountConditions],
      };
    } else if (orConditions.length > 0) {
      whereClause.account = { OR: orConditions };
    } else if (Object.keys(accountConditions).length > 0) {
      whereClause.account = accountConditions;
    }

    // Count total items
    const totalItems = await this.prismaService.employeeTimekeepingCutoff.count(
      {
        where: whereClause,
      },
    );

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'employeeCode':
        orderBy = { account: { EmployeeData: { employeeCode: sortOrder } } };
        break;
      case 'email':
        orderBy = { account: { email: sortOrder } };
        break;
      case 'username':
        orderBy = { account: { username: sortOrder } };
        break;
      case 'branch':
        orderBy = {
          account: { EmployeeData: { branch: { name: sortOrder } } },
        };
        break;
      case 'payrollGroup':
        orderBy = {
          account: {
            EmployeeData: { payrollGroup: { payrollGroupCode: sortOrder } },
          },
        };
        break;
      // Salary computation fields
      case 'basicSalary':
        orderBy = { EmployeeSalaryComputation: { basicSalary: sortOrder } };
        break;
      case 'deductionLate':
        orderBy = { EmployeeSalaryComputation: { deductionLate: sortOrder } };
        break;
      case 'deductionUndertime':
        orderBy = {
          EmployeeSalaryComputation: { deductionUndertime: sortOrder },
        };
        break;
      case 'deductionAbsent':
        orderBy = { EmployeeSalaryComputation: { deductionAbsent: sortOrder } };
        break;
      case 'basicPay':
        orderBy = { EmployeeSalaryComputation: { basicPay: sortOrder } };
        break;
      case 'allowance':
        orderBy = { EmployeeSalaryComputation: { allowance: sortOrder } };
        break;
      case 'earningRegularHoliday':
        orderBy = {
          EmployeeSalaryComputation: { earningRegularHoliday: sortOrder },
        };
        break;
      case 'earningOvertime':
        orderBy = { EmployeeSalaryComputation: { earningOvertime: sortOrder } };
        break;
      case 'earningNightDifferential':
        orderBy = {
          EmployeeSalaryComputation: { earningNightDifferential: sortOrder },
        };
        break;
      case 'earningRestDay':
        orderBy = { EmployeeSalaryComputation: { earningRestDay: sortOrder } };
        break;
      case 'earningSalaryAdjustment':
        orderBy = {
          EmployeeSalaryComputation: { earningSalaryAdjustment: sortOrder },
        };
        break;
      case 'grossPay':
        orderBy = { EmployeeSalaryComputation: { grossPay: sortOrder } };
        break;
      case 'governmentContributionSSS':
        orderBy = {
          EmployeeSalaryComputation: { governmentContributionSSS: sortOrder },
        };
        break;
      case 'governmentContributionPhilhealth':
        orderBy = {
          EmployeeSalaryComputation: {
            governmentContributionPhilhealth: sortOrder,
          },
        };
        break;
      case 'governmentContributionPagibig':
        orderBy = {
          EmployeeSalaryComputation: {
            governmentContributionPagibig: sortOrder,
          },
        };
        break;
      case 'governmentContributionTax':
        orderBy = {
          EmployeeSalaryComputation: { governmentContributionTax: sortOrder },
        };
        break;
      case 'loans':
        orderBy = { EmployeeSalaryComputation: { loans: sortOrder } };
        break;
      case 'totalDeduction':
        orderBy = { EmployeeSalaryComputation: { totalDeduction: sortOrder } };
        break;
      case 'netPay':
        orderBy = { EmployeeSalaryComputation: { netPay: sortOrder } };
        break;
      case 'fullName':
      default:
        orderBy = [
          { account: { lastName: sortOrder } },
          { account: { firstName: sortOrder } },
        ];
        break;
    }

    // Get paginated employee timekeeping cutoffs with all necessary data
    const employeeTimekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          account: {
            include: {
              EmployeeData: {
                include: {
                  payrollGroup: true,
                  branch: true,
                },
              },
            },
          },
          EmployeeSalaryComputation: true,
        },
      });

    // Map to optimized response format
    const data: PayrollSummaryListItem[] = employeeTimekeepingCutoffs.map(
      (etc) => {
        const employeeData = etc.account.EmployeeData;
        return {
          employee: {
            accountId: etc.account.id,
            employeeCode: employeeData?.employeeCode || '',
            fullName: `${etc.account.firstName} ${etc.account.lastName}`,
            firstName: etc.account.firstName,
            lastName: etc.account.lastName,
            branchName: employeeData?.branch?.name || '',
            payrollGroupCode:
              employeeData?.payrollGroup?.payrollGroupCode || '',
          },
          salary: {
            timekeepingCutoffId: etc.id,
            basicSalary: etc.EmployeeSalaryComputation?.basicSalary || 0,
            deductionLate: etc.EmployeeSalaryComputation?.deductionLate || 0,
            deductionUndertime:
              etc.EmployeeSalaryComputation?.deductionUndertime || 0,
            deductionAbsent:
              etc.EmployeeSalaryComputation?.deductionAbsent || 0,
            basicPay: etc.EmployeeSalaryComputation?.basicPay || 0,
            allowance: etc.EmployeeSalaryComputation?.allowance || 0,
            earningRegularHoliday:
              etc.EmployeeSalaryComputation?.earningRegularHoliday || 0,
            earningSpecialHoliday:
              etc.EmployeeSalaryComputation?.earningSpecialHoliday || 0,
            earningOvertime:
              etc.EmployeeSalaryComputation?.earningOvertime || 0,
            earningNightDifferential:
              etc.EmployeeSalaryComputation?.earningNightDifferential || 0,
            earningNightDifferentialOvertime:
              etc.EmployeeSalaryComputation?.earningNightDifferentialOvertime ||
              0,
            earningRestDay: etc.EmployeeSalaryComputation?.earningRestDay || 0,
            earningSalaryAdjustment:
              etc.EmployeeSalaryComputation?.earningSalaryAdjustment || 0,
            grossPay: etc.EmployeeSalaryComputation?.grossPay || 0,
            governmentContributionSSS:
              etc.EmployeeSalaryComputation?.governmentContributionSSS || 0,
            governmentContributionPhilhealth:
              etc.EmployeeSalaryComputation?.governmentContributionPhilhealth ||
              0,
            governmentContributionPagibig:
              etc.EmployeeSalaryComputation?.governmentContributionPagibig || 0,
            governmentContributionTax:
              etc.EmployeeSalaryComputation?.governmentContributionTax || 0,
            loans: etc.EmployeeSalaryComputation?.loans || 0,
            totalDeduction: etc.EmployeeSalaryComputation?.totalDeduction || 0,
            netPay: etc.EmployeeSalaryComputation?.netPay || 0,
          },
        };
      },
    );

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getPayrollSummaryTotals(
    cutoffDateRangeId: string,
    search = '',
    branchId?: number,
    employmentStatusId?: string,
    departmentId?: string,
    roleId?: string,
  ): Promise<PayrollSummaryTotalsResponse> {
    // Validate cutoff exists
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: {
          id: cutoffDateRangeId,
        },
        include: {
          cutoff: true,
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Build where clause with search and filters (same as paginated method)
    const whereClause: any = {
      cutoffDateRangeId: cutoffDateRangeId,
    };

    // Build account conditions
    const accountConditions: any = {};
    const orConditions: any[] = [];

    if (search) {
      orConditions.push(
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          EmployeeData: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
      );
    }

    // Add filter conditions
    if (branchId) {
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        branchId: branchId,
      };
    }

    if (employmentStatusId) {
      // Employment status is in the EmployeeContract, not EmployeeData
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        activeContract: {
          employmentStatus: employmentStatusId,
        },
      };
    }

    if (departmentId) {
      accountConditions.role = {
        ...accountConditions.role,
        roleGroupId: departmentId,
      };
    }

    if (roleId) {
      accountConditions.roleId = roleId;
    }

    // Combine conditions
    if (orConditions.length > 0 && Object.keys(accountConditions).length > 0) {
      whereClause.account = {
        AND: [{ OR: orConditions }, accountConditions],
      };
    } else if (orConditions.length > 0) {
      whereClause.account = { OR: orConditions };
    } else if (Object.keys(accountConditions).length > 0) {
      whereClause.account = accountConditions;
    }

    // First, get all employeeTimekeepingCutoffIds that match our criteria
    const employeeTimekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: whereClause,
        select: {
          id: true,
        },
      });

    // Extract the IDs
    const employeeTimekeepingCutoffIds = employeeTimekeepingCutoffs.map(
      (etc) => etc.id,
    );

    // Execute aggregation query for all totals
    const aggregation =
      await this.prismaService.employeeSalaryComputation.aggregate({
        where: {
          employeeTimekeepingCutoffId: {
            in: employeeTimekeepingCutoffIds,
          },
        },
        _sum: {
          basicSalary: true,
          deductionLate: true,
          deductionUndertime: true,
          deductionAbsent: true,
          basicPay: true,
          allowance: true,
          earningRegularHoliday: true,
          earningSpecialHoliday: true,
          earningOvertime: true,
          earningNightDifferentialOvertime: true,
          earningRestDay: true,
          earningSalaryAdjustment: true,
          grossPay: true,
          governmentContributionSSS: true,
          governmentContributionPhilhealth: true,
          governmentContributionPagibig: true,
          governmentContributionTax: true,
          loans: true,
          deductionSalaryAdjustmnt: true,
          netPay: true,
        },
        _count: {
          employeeTimekeepingCutoffId: true,
        },
      });

    // Map aggregation results to response interface
    return {
      basicSalary: aggregation._sum.basicSalary || 0,
      deductionLate: aggregation._sum.deductionLate || 0,
      deductionUndertime: aggregation._sum.deductionUndertime || 0,
      deductionAbsent: aggregation._sum.deductionAbsent || 0,
      basicPay: aggregation._sum.basicPay || 0,
      allowance: aggregation._sum.allowance || 0,
      holiday:
        (aggregation._sum.earningRegularHoliday || 0) +
        (aggregation._sum.earningSpecialHoliday || 0),
      overtime: aggregation._sum.earningOvertime || 0,
      nightDiff: aggregation._sum.earningNightDifferentialOvertime || 0,
      restDay: aggregation._sum.earningRestDay || 0,
      manualEarnings: aggregation._sum.earningSalaryAdjustment || 0,
      grossPay: aggregation._sum.grossPay || 0,
      sss: aggregation._sum.governmentContributionSSS || 0,
      philhealth: aggregation._sum.governmentContributionPhilhealth || 0,
      pagibig: aggregation._sum.governmentContributionPagibig || 0,
      tax: aggregation._sum.governmentContributionTax || 0,
      loans: aggregation._sum.loans || 0,
      manualDeductions: aggregation._sum.deductionSalaryAdjustmnt || 0,
      netPay: aggregation._sum.netPay || 0,
      totalEmployees: aggregation._count.employeeTimekeepingCutoffId || 0,
    };
  }

  async getEmployeeSalaryComputation(
    timekeepingCutoffId: number,
    needRecompute = false,
  ): Promise<PayrollProcessingResponse> {
    timekeepingCutoffId = Number(timekeepingCutoffId);

    if (needRecompute) {
      await this.processSingleEmployee({ timekeepingCutoffId });
    }

    const employeeSalaryComputation: EmployeeSalaryComputation =
      await this.prismaService.employeeSalaryComputation.findUnique({
        where: {
          employeeTimekeepingCutoffId: timekeepingCutoffId,
        },
      });

    const timekeepingCutoff =
      await this.prismaService.employeeTimekeepingCutoff.findUnique({
        where: {
          id: timekeepingCutoffId,
        },
        include: {
          cutoffDateRange: {
            include: {
              cutoff: true,
            },
          },
        },
      });

    const employeeSalaryComputationPerDay: EmployeeSalaryComputationPerDay[] =
      await this.prismaService.employeeSalaryComputationPerDay.findMany({
        where: {
          timekeeping: {
            employeeTimekeepingCutoffId: timekeepingCutoffId,
          },
        },
        orderBy: {
          timekeeping: {
            date: 'asc',
          },
        },
      });

    // Get employee information to access payroll group settings
    const employeeData = await this.employeeListService.info(
      timekeepingCutoff.accountId,
    );

    const dayBreakdown: PayrollProcessingDayResponse[] = await Promise.all(
      employeeSalaryComputationPerDay.map(async (day) => {
        const timekeeping =
          await this.prismaService.employeeTimekeeping.findUnique({
            where: {
              id: day.timekeepingId,
            },
          });

        const shiftingWorkingDaysPerWeek =
          employeeData.payrollGroup.shiftingWorkingDaysPerWeek;
        const dailyRateComputationMethod =
          shiftingWorkingDaysPerWeek === 0 ? 'AUTO' : 'MANUAL';
        const monthlyWorkingDays =
          shiftingWorkingDaysPerWeek === 0
            ? undefined
            : this.getMonthlyWorkingDays(shiftingWorkingDaysPerWeek);

        // Check for approved leave on this date
        let hasApprovedLeave = false;
        let leaveType = '';
        let leaveCompensationType = '';

        try {
          const leaveIntegrationService = this.moduleRef.get(
            LeaveTimekeepingIntegrationService,
            { strict: false },
          );
          if (leaveIntegrationService) {
            const leaveData = await leaveIntegrationService.getLeaveForDate(
              timekeepingCutoff.accountId,
              timekeeping.dateString,
            );

            if (leaveData) {
              hasApprovedLeave = true;
              const leaveInfo = leaveData.leaveData as any;
              leaveType = leaveInfo?.leaveType || '';
              leaveCompensationType = leaveInfo?.compensationType || '';
            }
          }
        } catch (error) {
          // Silent fail - leave integration might not be available
        }

        return {
          timekeepingId: timekeeping.id,
          date: this.utilityService.formatDate(timekeeping.dateString),
          dailyRate: day.dailyRate,
          dailyRateComputationMethod,
          monthlyWorkingDays,
          workingDaysPerWeek:
            shiftingWorkingDaysPerWeek === 0
              ? undefined
              : shiftingWorkingDaysPerWeek,
          additionalEarnings: {
            overtime: day.earningOvertime,
            overtimeRaw: day.earningOvertimeRaw,
            timeOvertime: this.utilityService.formatHours(
              timekeeping.overtimeMinutesApproved / 60,
            ),
            nightDifferential: day.earningNightDifferential,
            nightDifferentialRaw: day.earningNightDifferentialRaw,
            timeNightDifferential: this.utilityService.formatHours(
              timekeeping.nightDifferentialMinutes / 60,
            ),
            nightDifferentialOvertime: day.earningNightDifferentialOvertime,
            nightDifferentialOvertimeRaw:
              day.earningNightDifferentialOvertimeRaw,
            timeNightDifferentialOvertime: this.utilityService.formatHours(
              timekeeping.nightDifferentialOvertimeApproved / 60,
            ),
            regularHoliday: day.earningRegularHoliday,
            specialHoliday: day.earningSpecialHoliday,
            restDay: day.earningRestDay,
            total: day.totalAdditionalEarnings,
          },
          deductions: {
            absent: day.deductionAbsent,
            undertime: day.deductionUndertime,
            timeUndertime: this.utilityService.formatHours(
              timekeeping.undertimeMinutes / 60,
            ),
            late: day.deductionLate,
            timeLate: this.utilityService.formatHours(
              timekeeping.lateMinutes / 60,
            ),
            total: day.totalDeduction,
          },
          rates: {
            rateRestDay: day.rateRestDay,
            rateOvertime: day.rateOvertime,
            rateNightDifferential: day.rateNightDifferential,
            rateNightDifferentialOvertime: day.rateNightDifferentialOvertime,
            rateRegularHoliday: day.rateRegularHoliday,
            rateSpecialHoliday: day.rateSpecialHoliday,
          },
          basicPay: day.basicPay,
          totalWorkDaysInYear: day.totalWorkDaysInYear,
          totalWorkDaysInYearBreakdown: {
            monday: day.yearCountMonday,
            isMondayWorkDay: day.isMondayWorkDay,
            tuesday: day.yearCountTuesday,
            isTuesdayWorkDay: day.isTuesdayWorkDay,
            wednesday: day.yearCountWednesday,
            isWednesdayWorkDay: day.isWednesdayWorkDay,
            thursday: day.yearCountThursday,
            isThursdayWorkDay: day.isThursdayWorkDay,
            friday: day.yearCountFriday,
            isFridayWorkDay: day.isFridayWorkDay,
            saturday: day.yearCountSaturday,
            isSaturdayWorkDay: day.isSaturdayWorkDay,
            sunday: day.yearCountSunday,
            isSundayWorkDay: day.isSundayWorkDay,
          },
          hasApprovedLeave,
          leaveType,
          leaveCompensationType,
        };
      }),
    );

    const response: PayrollProcessingResponse = {
      timekeepingCutoffId:
        employeeSalaryComputation.employeeTimekeepingCutoffId,
      salaryRate: {
        monthlyRate: employeeSalaryComputation.monthlyRate || 0,
        cutoffRate: employeeSalaryComputation.cutoffRate || 0,
        dailyRate: employeeSalaryComputation.dailyRate || 0,
        hourlyRate: employeeSalaryComputation.hourlyRate || 0,
      },
      summary: {
        cutoffType: CutoffTypeReference.find(
          (cutoff) =>
            cutoff.key === timekeepingCutoff.cutoffDateRange.cutoff.cutoffType,
        ),
        salaryRateType: SalaryRateTypeReference.find(
          (salaryRate) =>
            salaryRate.key === employeeSalaryComputation.salaryRateType,
        ),
        deductionPeriodWitholdingTax: DeductionPeriodReference.find(
          (cutoff) =>
            cutoff.key ===
            employeeSalaryComputation.deductionPeriodWitholdingTax,
        ),
        deductionPeriodSSS: DeductionPeriodReference.find(
          (cutoff) =>
            cutoff.key === employeeSalaryComputation.deductionPeriodSSS,
        ),
        deductionPeriodPhilhealth: DeductionPeriodReference.find(
          (cutoff) =>
            cutoff.key === employeeSalaryComputation.deductionPeriodPhilhealth,
        ),
        deductionPeriodPagibig: DeductionPeriodReference.find(
          (cutoff) =>
            cutoff.key === employeeSalaryComputation.deductionPeriodPagibig,
        ),
        deductionBasisSSS: DeductionBasisReference.find(
          (cutoff) =>
            cutoff.key === employeeSalaryComputation.deductionBasisSSS,
        ),
        deductionBasisPhilhealth: DeductionBasisReference.find(
          (cutoff) =>
            cutoff.key === employeeSalaryComputation.deductionBasisPhilhealth,
        ),

        contributions: {
          sss: employeeSalaryComputation.governmentContributionSSS,
          sssAmountBasis:
            employeeSalaryComputation.governmentContributionSSSBasis,
          sssAmountBasisPrevious:
            employeeSalaryComputation.governmentContributionSSSBasisPrevious,
          sssAmountBasisCurrent:
            employeeSalaryComputation.governmentContributionSSSBasicCurrent,
          sssBreakdown: {
            employee: {
              regular: employeeSalaryComputation.governmentContributionSSSEER,
              mandatoryProvidentFund:
                employeeSalaryComputation.governmentContributionSSSEEMPF,
              total: employeeSalaryComputation.governmentContributionSSSEETotal,
            },
            employer: {
              regular: employeeSalaryComputation.governmentContributionSSSERR,
              ec: employeeSalaryComputation.governmentContributionSSSEREC,
              mandatoryProvidentFund:
                employeeSalaryComputation.governmentContributionSSSERMPF,
              total: employeeSalaryComputation.governmentContributionSSSERTotal,
            },
            monthlySalaryCredit: {
              regular: employeeSalaryComputation.governmentContributionSSSMSR,
              mandatoryProvidentFund:
                employeeSalaryComputation.governmentContributionSSSMSMPF,
              total: employeeSalaryComputation.governmentContributionSSSMSTotal,
            },
          },
          philhealth:
            employeeSalaryComputation.governmentContributionPhilhealth,
          philhealthAmountBasis:
            employeeSalaryComputation.governmentContributionPhilhealthBasis,
          philhealthAmountBasisPrevious:
            employeeSalaryComputation.governmentContributionPhilhealthBasisPrevious,
          philhealthAmountBasisCurrent:
            employeeSalaryComputation.governmentContributionPhilhealthBasicCurrent,
          philhealthBreakdown: {
            employeeShare:
              employeeSalaryComputation.governmentContributionPhilhealthEmployeeShare,
            employerShare:
              employeeSalaryComputation.governmentContributionPhilhealthEmployerShare,
            minimumContribution:
              employeeSalaryComputation.governmentContributionPhilhealthMinimum,
            maximumContribution:
              employeeSalaryComputation.governmentContributionPhilhealthMaximum,
            percentage: this.utilityService.formatPercentage(
              employeeSalaryComputation.governmentContributionPhilhealthPercentage /
                100,
            ),
            total:
              employeeSalaryComputation.governmentContributionPhilhealthEmployeeShare +
              employeeSalaryComputation.governmentContributionPhilhealthEmployerShare,
          },
          pagibig: employeeSalaryComputation.governmentContributionPagibig,
          pagibigAmountBasis:
            employeeSalaryComputation.governmentContributionPagibigBasis,
          pagibigAmountBasisPrevious:
            employeeSalaryComputation.governmentContributionPagibigBasisPrevious,
          pagibigAmountBasisCurrent:
            employeeSalaryComputation.governmentContributionPagibigBasicCurrent,
          pagibigBreakdown: {
            percentage: this.utilityService.formatPercentage(
              employeeSalaryComputation.governmentContributionPagibigPercentage /
                100,
            ),
            employee: {
              minimum:
                employeeSalaryComputation.governmentContributionPagibigMinimumShare,
              minimumPercentage: this.utilityService.formatPercentage(
                employeeSalaryComputation.governmentContributionPagibigMinimumPercentage /
                  100,
              ),
              maximum:
                employeeSalaryComputation.governmentContributionPagibigMaximumEEShare,
              contribution:
                employeeSalaryComputation.governmentContributionPagibigEmployeeShare,
            },
            employer: {
              maximum:
                employeeSalaryComputation.governmentContributionPagibigMaximumERShare,
              contribution:
                employeeSalaryComputation.governmentContributionPagibigEmployerShare,
            },
            total:
              employeeSalaryComputation.governmentContributionPagibigEmployeeShare +
              employeeSalaryComputation.governmentContributionPagibigEmployerShare,
          },
          withholdingTax: employeeSalaryComputation.governmentContributionTax,
        },

        additionalEarnings: {
          overtime: employeeSalaryComputation.earningOvertime,
          overtimeRaw: 0,
          timeOvertime: this.utilityService.formatHours(
            timekeepingCutoff.overtimeMinutesApproved / 60,
          ),
          nightDifferential: employeeSalaryComputation.earningNightDifferential,
          nightDifferentialRaw: 0,
          timeNightDifferential: this.utilityService.formatHours(
            timekeepingCutoff.nightDifferentialMinutes / 60,
          ),
          nightDifferentialOvertime:
            employeeSalaryComputation.earningNightDifferentialOvertime,
          nightDifferentialOvertimeRaw: 0,
          timeNightDifferentialOvertime: this.utilityService.formatHours(
            timekeepingCutoff.nightDifferentialOvertimeApproved / 60,
          ),
          regularHoliday: employeeSalaryComputation.earningRegularHoliday,
          specialHoliday: employeeSalaryComputation.earningSpecialHoliday,
          restDay: employeeSalaryComputation.earningRestDay,
          total: employeeSalaryComputation.totalAdditionalEarnings,
        },
        deductions: {
          undertime: employeeSalaryComputation.deductionUndertime,
          absent: employeeSalaryComputation.deductionAbsent,
          timeUndertime: this.utilityService.formatHours(
            timekeepingCutoff.undertimeMinutes / 60,
          ),
          late: employeeSalaryComputation.deductionLate,
          timeLate: this.utilityService.formatHours(
            timekeepingCutoff.lateMinutes / 60,
          ),
          total: employeeSalaryComputation.totalDeduction,
        },
        taxComputationBreakdown: {
          totalBasicSalary: employeeSalaryComputation.basicSalary,
          totalEarnings: employeeSalaryComputation.totalAdditionalEarnings,
          totalTaxableAllowance: employeeSalaryComputation.taxableAllowance,
          grossTaxableIncome: employeeSalaryComputation.grossTaxableIncome,
          nonTaxableGovernmentContribution:
            employeeSalaryComputation.totalNonTaxableGovernmentContribution,
          totalDeduction: employeeSalaryComputation.totalDeduction,
          nonTaxableDeduction: employeeSalaryComputation.nonTaxableDeduction,
          taxableIncome: employeeSalaryComputation.taxableIncome,
          taxableIncomePrevious:
            employeeSalaryComputation.taxableIncomePrevious,
          taxableIncomeCurrent: employeeSalaryComputation.taxableIncomeCurrent,
          taxOffset: employeeSalaryComputation.taxOffset,
          taxByPercentage: employeeSalaryComputation.taxByPercentage,
          taxPercentage: this.utilityService.formatPercentage(
            employeeSalaryComputation.taxPercentage / 100,
          ),
          taxFixedAmount: employeeSalaryComputation.taxFixedAmount,
          taxTotal: employeeSalaryComputation.taxTotal,
        },
        salaryAdjustmentEarnings:
          employeeSalaryComputation.earningSalaryAdjustment,
        salaryAdjustmentDeductions:
          employeeSalaryComputation.deductionSalaryAdjustmnt,
        salaryAdjustment: employeeSalaryComputation.salaryAdjustment,
        totalSalaryAdjustment:
          employeeSalaryComputation.earningSalaryAdjustment -
          employeeSalaryComputation.deductionSalaryAdjustmnt,
        basicSalary: employeeSalaryComputation.basicSalary,
        totalBasicSalary: employeeSalaryComputation.totalBasicSalary,
        basicPayBeforeAdjustment:
          employeeSalaryComputation.basicPayBeforeAdjustment,
        totalDeduction: employeeSalaryComputation.totalDeduction,
        totalAdditionalDeduction:
          employeeSalaryComputation.totalAdditionalDeduction,
        totalGovernmentContribution:
          employeeSalaryComputation.totalGovernmentContribution,
        taxableAllowance: employeeSalaryComputation.taxableAllowance,
        nonTaxableAllowance: employeeSalaryComputation.nonTaxableAllowance,
        totalAllowance: employeeSalaryComputation.allowance,
        totalLoan: employeeSalaryComputation.loans,
        basicPay: employeeSalaryComputation.basicPay,
        grossPay: employeeSalaryComputation.grossPay,
        netPay: employeeSalaryComputation.netPay,
      },
      dayBreakdown: dayBreakdown,
    };

    return response;
  }

  async recomputeSalary(
    cutoffDateRangeId: string,
  ): Promise<{ queueId: string }> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      { where: { id: cutoffDateRangeId } },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    const paramUpdateCutoffDateRange: any = {
      status: CutoffDateRangeStatus.PENDING,
    };

    /* queue */
    const dateStart = this.utilityService.formatDate(cutoffDateRange.startDate);
    const dateEnd = this.utilityService.formatDate(cutoffDateRange.endDate);

    // If queueService and QueueType are not defined, you may need to inject and import them properly.
    const queue = await this.queueService.createQueue({
      name: `Payroll processing for ${dateStart.dateFull} to ${dateEnd.dateFull}`,
      type: QueueType.PAYROLL_PROCESSING,
      queueSettings: {
        cutoffDateRangeId: cutoffDateRange.id,
      },
    });

    /* update queue id */
    paramUpdateCutoffDateRange.payrollProcessingQueueId = queue.id;

    await this.prismaService.cutoffDateRange.update({
      where: { id: cutoffDateRange.id },
      data: paramUpdateCutoffDateRange,
    });
    return { queueId: queue.id };
  }

  async updateCutoffDateRangeStatus(
    cutoffDateRangeId: string,
    status: CutoffDateRangeStatus,
  ): Promise<void> {
    // validate if cutoffDateRangeId is a string and not blank
    if (!cutoffDateRangeId || cutoffDateRangeId === '') {
      throw new Error('Cutoff date range id is required');
    }

    // validate if status is valid
    if (!Object.values(CutoffDateRangeStatus).includes(status)) {
      throw new Error(
        'Invalid status - ' +
          status +
          ' - ' +
          Object.values(CutoffDateRangeStatus).join(', '),
      );
    }

    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      { where: { id: cutoffDateRangeId } },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Update the cutoff status
    await this.prismaService.cutoffDateRange.update({
      where: { id: cutoffDateRangeId },
      data: { status },
    });

    // Handle approval tasks cleanup when manually approving or rejecting
    if (
      status === CutoffDateRangeStatus.APPROVED ||
      status === CutoffDateRangeStatus.REJECTED
    ) {
      // Close all open approval tasks for this cutoff
      const tasksToClose = await this.prismaService.task.findMany({
        where: {
          ApprovalMetadata: {
            sourceId: cutoffDateRangeId,
            sourceModule: 'PAYROLL',
          },
          isOpen: true,
        },
        include: {
          assignedTo: true,
        },
      });

      if (tasksToClose.length > 0) {
        await this.prismaService.task.updateMany({
          where: {
            id: {
              in: tasksToClose.map((task) => task.id),
            },
          },
          data: {
            isOpen: false,
          },
        });

        // Store manual approval/rejection in history
        const currentUser = this.utilityService.accountInformation;
        await this.prismaService.payrollApprovalHistory.create({
          data: {
            cutoffDateRangeId,
            approverId: currentUser.id,
            action:
              status === CutoffDateRangeStatus.APPROVED
                ? 'APPROVED'
                : 'REJECTED',
            approvalLevel: 0, // 0 indicates manual override
            remarks: `Manually ${status.toLowerCase()} by ${currentUser.firstName} ${currentUser.lastName}`,
            approvedAt: new Date(),
          },
        });

        // Get cutoff details for notification
        const cutoffDateRange =
          await this.prismaService.cutoffDateRange.findUnique({
            where: { id: cutoffDateRangeId },
            include: {
              cutoff: {
                include: {
                  PayrollGroup: true,
                },
              },
            },
          });

        // Notify affected approvers
        const affectedApprovers = tasksToClose.map((task) => task.assignedToId);
        const uniqueApprovers = [...new Set(affectedApprovers)];

        if (uniqueApprovers.length > 0 && cutoffDateRange) {
          const payrollGroupCode =
            cutoffDateRange.cutoff.PayrollGroup[0]?.payrollGroupCode ||
            'Unknown';
          const notificationMessage = `Your payroll approval task for ${payrollGroupCode} has been manually ${status.toLowerCase()} by ${currentUser.firstName} ${currentUser.lastName}`;

          await this.notificationService.sendNotifications(
            0, // system notification
            currentUser.id,
            uniqueApprovers,
            notificationMessage,
            'PAYROLL_MANUAL_OVERRIDE',
            cutoffDateRangeId,
          );
        }
      }
    }

    // Emit to all users in the same company
    this.socketService.emitToCompany(
      this.utilityService.companyId,
      'cutoff-date-range-status-updated',
      {
        cutoffDateRangeId,
        status,
        companyId: this.utilityService.companyId,
      },
    );
  }

  private emitPayrollListChange(
    cutoffDateRangeId: string,
    action: 'created' | 'updated' | 'deleted',
    affectedStatuses: CutoffDateRangeStatus[],
  ) {
    this.socketService.emitToCompany(
      this.utilityService.companyId,
      'payroll-cutoff-list-changed',
      {
        cutoffDateRangeId,
        action,
        affectedStatuses,
        companyId: this.utilityService.companyId,
        timestamp: new Date(),
      },
    );
  }

  private emitPayrollItemUpdate(
    cutoffDateRangeId: string,
    status: CutoffDateRangeStatus,
    additionalData?: any,
  ) {
    this.socketService.emitToCompany(
      this.utilityService.companyId,
      'payroll-cutoff-item-updated',
      {
        cutoffDateRangeId,
        status,
        companyId: this.utilityService.companyId,
        timestamp: new Date(),
        ...additionalData,
      },
    );
  }

  async returnToTimekeeping(cutoffDateRangeId: string): Promise<void> {
    await this.updateCutoffDateRangeStatus(
      cutoffDateRangeId,
      CutoffDateRangeStatus.TIMEKEEPING,
    );
  }

  async resubmitForApproval(cutoffDateRangeId: string): Promise<void> {
    // 1. Validate cutoff exists and is rejected
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: { id: cutoffDateRangeId },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    if (cutoffDateRange.status !== CutoffDateRangeStatus.REJECTED) {
      throw new Error('Only rejected payrolls can be resubmitted for approval');
    }

    // 2. Ensure all old approval tasks are closed (defensive check)
    const openTasks = await this.prismaService.task.findMany({
      where: {
        ApprovalMetadata: {
          sourceId: cutoffDateRangeId,
          sourceModule: 'PAYROLL',
        },
        isOpen: true,
      },
    });

    if (openTasks.length > 0) {
      // Close any remaining open tasks
      await this.prismaService.task.updateMany({
        where: {
          id: { in: openTasks.map((t) => t.id) },
        },
        data: { isOpen: false },
      });
    }

    // 3. Add resubmission record to approval history
    await this.prismaService.payrollApprovalHistory.create({
      data: {
        cutoffDateRangeId,
        approverId: this.utilityService.accountInformation.id,
        action: 'RESUBMITTED',
        approvalLevel: 0,
        remarks: `Resubmitted for approval by ${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
        approvedAt: new Date(),
      },
    });

    // 4. Update status to PROCESSED
    await this.updateCutoffDateRangeStatus(
      cutoffDateRangeId,
      CutoffDateRangeStatus.PROCESSED,
    );

    // Emit list change event for resubmission
    this.emitPayrollListChange(cutoffDateRangeId, 'updated', [
      CutoffDateRangeStatus.REJECTED,
      CutoffDateRangeStatus.PROCESSED,
    ]);

    // 5. Create new approval tasks with current approver configuration
    await this.initiatePayrollApproval(cutoffDateRangeId);
  }

  async getGovernmentPaymentHistory(cutoffDateRangeId: string): Promise<any[]> {
    const governmentPayments =
      await this.prismaService.governmentPaymentHistory.findMany({
        where: { cutoffDateRangeId },
        include: {
          account: {
            include: {
              EmployeeData: true,
            },
          },
        },
        orderBy: [{ accountId: 'asc' }, { type: 'asc' }],
      });

    return governmentPayments.map((payment) => ({
      id: payment.id,
      type: payment.type,
      amount: this.utilityService.formatCurrency(payment.amount),
      employeeShare: this.utilityService.formatCurrency(payment.employeeShare),
      employerShare: this.utilityService.formatCurrency(payment.employerShare),
      basis: this.utilityService.formatCurrency(payment.basis),
      accountId: payment.accountId,
      employeeName: `${payment.account.firstName} ${payment.account.lastName}`,
      createdAt: this.utilityService.formatDate(payment.createdAt),
    }));
  }

  async getGovernmentPaymentHistoryByType(params: {
    type: GovernmentPaymentType;
    startDate?: string;
    endDate?: string;
    accountId?: string;
    cutoffDateRangeId?: string;
  }): Promise<any[]> {
    const { type, startDate, endDate, accountId, cutoffDateRangeId } = params;

    const where: any = { type };

    if (cutoffDateRangeId) {
      where.cutoffDateRangeId = cutoffDateRangeId;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const governmentPayments =
      await this.prismaService.governmentPaymentHistory.findMany({
        where,
        include: {
          account: {
            include: {
              EmployeeData: {
                include: {
                  branch: true,
                },
              },
            },
          },
          cutoffDateRange: true,
        },
        orderBy: [{ createdAt: 'desc' }, { accountId: 'asc' }],
      });

    return governmentPayments.map((payment) => ({
      id: payment.id,
      type: payment.type,
      amount: this.utilityService.formatCurrency(payment.amount),
      employeeShare: this.utilityService.formatCurrency(payment.employeeShare),
      employerShare: this.utilityService.formatCurrency(payment.employerShare),
      basis: this.utilityService.formatCurrency(payment.basis),
      // SSS Breakdown fields
      employeeShareRegular: this.utilityService.formatCurrency(
        payment.employeeShareRegular || 0,
      ),
      employeeShareMPF: this.utilityService.formatCurrency(
        payment.employeeShareMPF || 0,
      ),
      employerShareRegular: this.utilityService.formatCurrency(
        payment.employerShareRegular || 0,
      ),
      employerShareMPF: this.utilityService.formatCurrency(
        payment.employerShareMPF || 0,
      ),
      employerShareEC: this.utilityService.formatCurrency(
        payment.employerShareEC || 0,
      ),
      accountId: payment.accountId,
      employeeCode: payment.account.EmployeeData?.employeeCode || '-',
      sssNumber: payment.account.EmployeeData?.sssNumber || '-',
      lastName: payment.account.lastName || '-',
      firstName: payment.account.firstName || '-',
      middleName: payment.account.middleName || '-',
      employeeName: `${payment.account.firstName} ${payment.account.lastName}`,
      branch: payment.account.EmployeeData?.branch?.name || '-',
      covered: new Date(payment.createdAt).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      periodStart: this.utilityService.formatDate(
        payment.cutoffDateRange.startDate,
      ),
      periodEnd: this.utilityService.formatDate(
        payment.cutoffDateRange.endDate,
      ),
      datePosted: this.utilityService.formatDate(payment.createdAt),
      cutoffDateRangeId: payment.cutoffDateRangeId,
    }));
  }

  async submitNextStatus(cutoffDateRangeId: string): Promise<void> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      { where: { id: cutoffDateRangeId } },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    switch (cutoffDateRange.status) {
      case CutoffDateRangeStatus.PENDING:
        await this.updateCutoffDateRangeStatus(
          cutoffDateRangeId,
          CutoffDateRangeStatus.PROCESSED,
        );
        // Emit list change event
        this.emitPayrollListChange(cutoffDateRangeId, 'updated', [
          CutoffDateRangeStatus.PENDING,
          CutoffDateRangeStatus.PROCESSED,
        ]);
        // Automatically initiate approval process when moving to PROCESSED
        await this.initiatePayrollApproval(cutoffDateRangeId);
        break;
      case CutoffDateRangeStatus.PROCESSED:
        // This case now only happens if approval tasks were already created
        // Check if tasks exist before creating new ones
        const existingTasks = await this.prismaService.task.findFirst({
          where: {
            ApprovalMetadata: {
              sourceId: cutoffDateRangeId,
              sourceModule: 'PAYROLL',
            },
          },
        });

        if (!existingTasks) {
          // Create approval tasks if they don't exist
          await this.initiatePayrollApproval(cutoffDateRangeId);
        } else {
          throw new Error(
            'Payroll approval is already in progress. Please check the approval tasks.',
          );
        }
        break;
      case CutoffDateRangeStatus.APPROVED:
        // Check if this cutoff has already been posted (detect reposting scenario)
        const hasPostedRecords =
          await this.prismaService.governmentPaymentHistory.count({
            where: { cutoffDateRangeId },
          });

        const isReposting = hasPostedRecords > 0;

        // Process posting of payroll data before updating status
        const postingResult =
          await this.postedPayrollService.processCutoffPosting(
            cutoffDateRangeId,
            isReposting,
          );

        if (!postingResult.success) {
          throw new Error(
            `Failed to post payroll: ${postingResult.errors.length} errors occurred`,
          );
        }

        await this.updateCutoffDateRangeStatus(
          cutoffDateRangeId,
          CutoffDateRangeStatus.POSTED,
        );
        // Emit list change event
        this.emitPayrollListChange(cutoffDateRangeId, 'updated', [
          CutoffDateRangeStatus.APPROVED,
          CutoffDateRangeStatus.POSTED,
        ]);
        break;
      default:
        throw new Error('No more status to submit.');
    }
  }

  async repostCutoff(cutoffDateRangeId: string): Promise<void> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      { where: { id: cutoffDateRangeId } },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Only allow re-posting for POSTED cutoffs
    if (cutoffDateRange.status !== CutoffDateRangeStatus.POSTED) {
      throw new Error('Only POSTED cutoffs can be re-posted');
    }

    // Process re-posting of payroll data
    const postingResult = await this.postedPayrollService.processCutoffPosting(
      cutoffDateRangeId,
      true,
    );

    if (!postingResult.success) {
      throw new Error(
        `Failed to re-post payroll: ${postingResult.errors.length} errors occurred`,
      );
    }
  }

  async getEmployeeComputation(
    accountId: string,
    cutoffDateRangeId: string,
  ): Promise<SalaryInformationListResponse> {
    // Find the employee's timekeeping cutoff for this cutoff date range
    const employeeTimekeepingCutoff =
      await this.prismaService.employeeTimekeepingCutoff.findFirst({
        where: {
          accountId: accountId,
          cutoffDateRangeId: cutoffDateRangeId,
        },
      });

    if (!employeeTimekeepingCutoff) {
      throw new Error('Employee timekeeping cutoff not found');
    }

    // Get employee information
    const employeeInformation = await this.employeeListService.info(accountId);

    // Get salary computation
    const salaryComputation = await this.getEmployeeSalaryComputation(
      employeeTimekeepingCutoff.id,
    );

    return {
      employeeInformation,
      salaryComputation,
    };
  }

  async getCutoffTotals(cutoffDateRangeId: string): Promise<any> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: { id: cutoffDateRangeId },
        select: {
          totalNetPay: true,
          totalGrossPay: true,
          totalBasicPay: true,
          totalBasicSalary: true,
          totalAllowance: true,
          totalDeductionLate: true,
          totalDeductionUndertime: true,
          totalDeductionAbsent: true,
          totalDeductionSalaryAdjustmnt: true,
          totalEarningOvertime: true,
          totalEarningNightDiff: true,
          totalEarningRestDay: true,
          totalEarningRegularHoliday: true,
          totalEarningSpecialHoliday: true,
          totalEarningsPlusAllowance: true,
          totalGovernmentContributionSSS: true,
          totalGovernmentContributionPhilhealth: true,
          totalGovernmentContributionPagibig: true,
          totalGovernmentContributionTax: true,
          totalLoans: true,
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Format the totals to match the frontend structure
    return {
      totalNetPay: { raw: cutoffDateRange.totalNetPay },
      totalGrossPay: { raw: cutoffDateRange.totalGrossPay },
      totalBasicPay: { raw: cutoffDateRange.totalBasicPay },
      totalBasicSalary: { raw: cutoffDateRange.totalBasicSalary },
      totalAllowance: { raw: cutoffDateRange.totalAllowance },
      totalDeductionLate: { raw: cutoffDateRange.totalDeductionLate },
      totalDeductionUndertime: { raw: cutoffDateRange.totalDeductionUndertime },
      totalDeductionAbsent: { raw: cutoffDateRange.totalDeductionAbsent },
      totalDeductionSalaryAdjustmnt: {
        raw: cutoffDateRange.totalDeductionSalaryAdjustmnt,
      },
      totalEarningOvertime: { raw: cutoffDateRange.totalEarningOvertime },
      totalEarningNightDiff: { raw: cutoffDateRange.totalEarningNightDiff },
      totalEarningRestDay: { raw: cutoffDateRange.totalEarningRestDay },
      totalEarningRegularHoliday: {
        raw: cutoffDateRange.totalEarningRegularHoliday,
      },
      totalEarningSpecialHoliday: {
        raw: cutoffDateRange.totalEarningSpecialHoliday,
      },
      totalEarningsPlusAllowance: {
        raw: cutoffDateRange.totalEarningsPlusAllowance,
      },
      totalGovernmentContributionSSS: {
        raw: cutoffDateRange.totalGovernmentContributionSSS,
      },
      totalGovernmentContributionPhilhealth: {
        raw: cutoffDateRange.totalGovernmentContributionPhilhealth,
      },
      totalGovernmentContributionPagibig: {
        raw: cutoffDateRange.totalGovernmentContributionPagibig,
      },
      totalGovernmentContributionTax: {
        raw: cutoffDateRange.totalGovernmentContributionTax,
      },
      totalLoans: { raw: cutoffDateRange.totalLoans },
    };
  }

  private getMonthlyWorkingDays(daysPerWeek: number): number {
    const mapping: { [key: number]: number } = {
      1: 4, // 1 day/week ≈ 4 days/month
      2: 9, // 2 days/week ≈ 9 days/month
      3: 13, // 3 days/week ≈ 13 days/month
      4: 17, // 4 days/week ≈ 17 days/month
      5: 22, // 5 days/week ≈ 22 days/month
      6: 26, // 6 days/week ≈ 26 days/month
      7: 30, // 7 days/week ≈ 30 days/month
    };
    return mapping[daysPerWeek] || 22;
  }

  async initiatePayrollApproval(cutoffDateRangeId: string): Promise<void> {
    // Get the cutoff data
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: { id: cutoffDateRangeId },
        include: {
          cutoff: {
            include: {
              PayrollGroup: true,
            },
          },
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    if (cutoffDateRange.status !== CutoffDateRangeStatus.PROCESSED) {
      throw new Error(
        'Cutoff must be in PROCESSED status to initiate approval',
      );
    }

    // Get the approval chain
    const approvalChain = await this.payrollApproversService.getApprovalChain();

    if (Object.keys(approvalChain).length === 0) {
      throw new Error('No payroll approvers configured');
    }

    // Get the first level approvers
    const firstLevelApprovers = approvalChain['1'] || [];

    if (firstLevelApprovers.length === 0) {
      throw new Error('No Level 1 approvers configured');
    }

    const maxLevel = Math.max(...Object.keys(approvalChain).map(Number));

    // Use the PayrollApprovalStrategy to create approval tasks with email notifications
    // The strategy's createApprovalTask method handles email sending
    for (const approverId of firstLevelApprovers) {
      await (this.payrollApprovalStrategy as any).createApprovalTask(
        cutoffDateRangeId,
        approverId,
        1, // level
        maxLevel,
      );
    }
  }

  async updateCutoffStatusToProcessed(
    cutoffDateRangeId: string,
  ): Promise<void> {
    // Update the cutoff status to PROCESSED
    await this.prismaService.cutoffDateRange.update({
      where: { id: cutoffDateRangeId },
      data: { status: CutoffDateRangeStatus.PROCESSED },
    });

    // Initiate the approval process
    await this.initiatePayrollApproval(cutoffDateRangeId);
  }

  async getPayslipInfo(
    employeeTimekeepingCutoffId: number,
    cutoffDateRangeId: string,
  ) {
    const timekeepingCutoffId = Number(employeeTimekeepingCutoffId);

    // Get employee timekeeping cutoff
    const timekeepingCutoff =
      await this.prismaService.employeeTimekeepingCutoff.findUnique({
        where: { id: timekeepingCutoffId },
        include: {
          cutoffDateRange: true,
        },
      });

    if (!timekeepingCutoff) {
      throw new Error('Employee timekeeping cutoff not found');
    }

    // Get company information
    const company = await this.prismaService.company.findUnique({
      where: { id: this.utilityService.companyId },
    });

    // Get approver information based on payroll status
    let approverName = '';
    const payrollStatus = timekeepingCutoff.cutoffDateRange.status;

    if (
      payrollStatus === CutoffDateRangeStatus.APPROVED ||
      payrollStatus === CutoffDateRangeStatus.POSTED
    ) {
      // Get the approval history for this cutoff
      const approvalHistory =
        await this.prismaService.payrollApprovalHistory.findFirst({
          where: {
            cutoffDateRangeId: cutoffDateRangeId,
            action: 'APPROVED',
          },
          include: {
            approver: true,
          },
          orderBy: {
            approvalLevel: 'desc', // Get highest level approver
          },
        });

      if (approvalHistory && approvalHistory.approver) {
        approverName = `${approvalHistory.approver.firstName} ${approvalHistory.approver.lastName}`;
      }
    }

    // Get existing allowances (already available)
    const allowances =
      await this.getEmployeeSalaryComputationAllowances(timekeepingCutoffId);

    // Get existing deductions and loans (already available)
    const deductions =
      await this.getEmployeeSalaryComputationDeductions(timekeepingCutoffId);

    // Get salary adjustments (already in system)
    const adjustments =
      await this.prismaService.employeeSalaryAdjustment.findMany({
        where: {
          accountId: timekeepingCutoff.accountId,
          cutoffDateRangeId: cutoffDateRangeId,
        },
      });

    // Get employee leave plans
    const employeeLeavePlans =
      await this.prismaService.employeeLeavePlan.findMany({
        where: {
          accountId: timekeepingCutoff.accountId,
          isActive: true,
        },
        include: {
          leavePlan: {
            include: {
              leaveTypeConfiguration: true,
            },
          },
        },
      });

    // Calculate leave credits
    const leaveCredits = employeeLeavePlans.map((elp) => {
      const currentCredits = parseFloat(elp.currentCredits.toString());
      const usedCredits = parseFloat(elp.usedCredits.toString());
      const remainingCredits = currentCredits - usedCredits;

      return {
        leaveType: elp.leavePlan.leaveTypeConfiguration.name,
        leaveTypeCode: elp.leavePlan.leaveTypeConfiguration.code,
        totalCredits: parseFloat(elp.totalAnnualCredits.toString()),
        currentCredits: currentCredits,
        usedCredits: usedCredits,
        remainingCredits: remainingCredits,
        carriedCredits: parseFloat(elp.carriedCredits.toString()),
      };
    });

    // Find vacation leave specifically
    const vacationLeave = leaveCredits.find(
      (lc) =>
        lc.leaveTypeCode === 'VL' ||
        lc.leaveTypeCode === 'VACATION' ||
        lc.leaveType.toLowerCase().includes('vacation'),
    );

    // Find sick leave specifically
    const sickLeave = leaveCredits.find(
      (lc) =>
        lc.leaveTypeCode === 'SL' ||
        lc.leaveTypeCode === 'SICK' ||
        lc.leaveType.toLowerCase().includes('sick'),
    );

    return {
      // Payroll status
      payrollStatus: payrollStatus,

      // Replace static company info
      company: {
        name: company?.companyName || 'Company Name',
        address: company?.address || '',
        contact: company?.phone || '',
        email: company?.email || '',
        website: company?.website || '',
        tinNo: company?.tinNo || '',
        registrationNo: company?.registrationNo || '',
        logoUrl: company?.logoUrl || '',
      },

      // Replace static transaction date
      transactionDate: timekeepingCutoff.cutoffDateRange.processingDate,

      // Replace empty allowances array
      allowances: allowances.map((a) => ({
        name: `${a.allowancePlan.allowanceConfiguration.name} - AL${a.allowancePlan.id}`,
        amount: Number(a.amount),
        category: a.allowancePlan.allowanceConfiguration.category,
        taxBasis: a.allowancePlan.allowanceConfiguration.taxBasis,
      })),

      // Replace empty loans array
      loans: deductions
        .filter(
          (d) => d.deductionPlan.deductionConfiguration.category.key === 'LOAN',
        )
        .map((loan) => ({
          name: `${loan.deductionPlan.deductionConfiguration.name} - ${loan.deductionPlan.planCode}`,
          amount: Number(loan.amount),
        })),

      // Replace empty additional deductions
      additionalDeductions: deductions
        .filter(
          (d) =>
            d.deductionPlan.deductionConfiguration.category.key === 'DEDUCTION',
        )
        .map((deduction) => ({
          name: `${deduction.deductionPlan.deductionConfiguration.name} - ${deduction.deductionPlan.planCode}`,
          amount: Number(deduction.amount),
        })),

      // Manual adjustments
      manualAdjustments: {
        allowances: adjustments
          .filter((a) => a.adjustmentType === 'ALLOWANCE')
          .map((a) => ({
            name: `${a.title} - Adjustment`,
            amount: Number(a.amount),
          })),
        deductions: adjustments
          .filter((a) => a.adjustmentType === 'DEDUCTION')
          .map((a) => ({
            name: `${a.title} - Adjustment`,
            amount: Number(a.amount),
          })),
        salary: adjustments
          .filter((a) => a.adjustmentType === 'SALARY')
          .map((a) => ({
            name: a.title,
            amount: Number(a.amount),
          })),
      },

      // Leave credits data (now from database)
      leaveCredits: {
        all: leaveCredits,
        vacation: vacationLeave
          ? {
              total: vacationLeave.totalCredits.toFixed(2),
              used: vacationLeave.usedCredits.toFixed(2),
              remaining: vacationLeave.remainingCredits.toFixed(2),
              carried: vacationLeave.carriedCredits.toFixed(2),
            }
          : null,
        sick: sickLeave
          ? {
              total: sickLeave.totalCredits.toFixed(2),
              used: sickLeave.usedCredits.toFixed(2),
              remaining: sickLeave.remainingCredits.toFixed(2),
              carried: sickLeave.carriedCredits.toFixed(2),
            }
          : null,
      },

      // Data that remains static (no source available)
      staticData: {
        companyAddress: company?.address || '', // Now using dynamic address from database
        approverName: approverName, // Now dynamic based on payroll status
        yearToDate: {
          grossSalary: 0,
          taxWithheld: 0,
          philhealth: 0,
          sss: 0,
          hdmf: 0,
        },
      },
    };
  }

  async exportPayrollSummary(
    cutoffDateRangeId: string,
    search = '',
    sortBy = 'fullName',
    sortOrder: 'asc' | 'desc' = 'asc',
    branchId?: number,
    employmentStatusId?: string,
    departmentId?: string,
    roleId?: string,
    format: 'csv' | 'excel' = 'csv',
  ): Promise<any> {
    // Get cutoff date range information
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: { id: cutoffDateRangeId },
        include: {
          cutoff: {
            include: {
              PayrollGroup: true,
            },
          },
        },
      },
    );

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Build the where conditions - same as getPayrollSummaryOptimized
    const accountConditions: any = {
      EmployeeData: {},
    };

    // Apply filters
    if (branchId) {
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        branchId: branchId,
      };
    }

    if (departmentId || roleId) {
      accountConditions.departmentId = departmentId || undefined;
      if (roleId) {
        accountConditions.roleId = roleId;
      }
    }

    if (employmentStatusId) {
      accountConditions.EmployeeData = {
        ...accountConditions.EmployeeData,
        activeContract: {
          employmentStatus: employmentStatusId,
        },
      };
    }

    // Apply search
    if (search) {
      accountConditions.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        {
          EmployeeData: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Get all timekeeping cutoffs with full account and salary information
    const timekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: {
          cutoffDateRangeId,
          account: accountConditions,
        },
        include: {
          account: {
            include: {
              EmployeeData: {
                include: {
                  activeContract: true,
                  payrollGroup: true,
                  branch: true,
                },
              },
            },
          },
          EmployeeSalaryComputation: true,
        },
        orderBy:
          sortBy === 'fullName'
            ? [
                { account: { lastName: sortOrder } },
                { account: { firstName: sortOrder } },
              ]
            : {
                account: {
                  [sortBy]: sortOrder,
                },
              },
      });

    // Transform data for export
    const data = timekeepingCutoffs
      .map((tc) => {
        const account = tc.account;
        const employee = account.EmployeeData;
        const salaryComp = tc.EmployeeSalaryComputation;

        if (!salaryComp) {
          return null;
        }

        return {
          employeeName: `${account.lastName}, ${account.firstName}${account.middleName ? ' ' + account.middleName : ''}`,
          employeeCode: employee?.employeeCode || '',
          branch: employee?.branch?.name || '',
          payrollGroup: employee?.payrollGroup?.payrollGroupCode || '',
          basicSalary: Number(salaryComp.basicSalary) || 0,
          late: Number(salaryComp.deductionLate) || 0,
          undertime: Number(salaryComp.deductionUndertime) || 0,
          absent: Number(salaryComp.deductionAbsent) || 0,
          basicPay: Number(salaryComp.basicPay) || 0,
          allowancePay: Number(salaryComp.allowance) || 0,
          holidayPay: Number(salaryComp.earningRegularHoliday) || 0,
          overtimePay: Number(salaryComp.earningOvertime) || 0,
          nightDifferentialPay:
            Number(salaryComp.earningNightDifferential) || 0,
          restDayPay: Number(salaryComp.earningRestDay) || 0,
          manualEarnings: Number(salaryComp.earningSalaryAdjustment) || 0,
          grossPay: Number(salaryComp.grossPay) || 0,
          sss: Number(salaryComp.governmentContributionSSS) || 0,
          philhealth: Number(salaryComp.governmentContributionPhilhealth) || 0,
          pagibig: Number(salaryComp.governmentContributionPagibig) || 0,
          tax: Number(salaryComp.governmentContributionTax) || 0,
          manualDeductions: Number(salaryComp.totalAdditionalDeduction) || 0,
          netPay: Number(salaryComp.netPay) || 0,
        };
      })
      .filter(Boolean); // Remove null entries

    // Return data for CSV or generate Excel file
    if (format === 'excel') {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payroll Summary');

      // Define columns
      worksheet.columns = [
        { header: 'Employee Name', key: 'employeeName', width: 30 },
        { header: 'Employee Code', key: 'employeeCode', width: 15 },
        { header: 'Branch', key: 'branch', width: 20 },
        { header: 'Payroll Group', key: 'payrollGroup', width: 20 },
        { header: 'Basic Salary', key: 'basicSalary', width: 15 },
        { header: 'Late', key: 'late', width: 12 },
        { header: 'Undertime', key: 'undertime', width: 12 },
        { header: 'Absent', key: 'absent', width: 12 },
        { header: 'Basic Pay', key: 'basicPay', width: 15 },
        { header: 'Allowance Pay', key: 'allowancePay', width: 15 },
        { header: 'Holiday Pay', key: 'holidayPay', width: 15 },
        { header: 'Overtime Pay', key: 'overtimePay', width: 15 },
        {
          header: 'Night Differential Pay',
          key: 'nightDifferentialPay',
          width: 20,
        },
        { header: 'Rest Day Pay', key: 'restDayPay', width: 15 },
        { header: 'Manual Earnings', key: 'manualEarnings', width: 15 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
        { header: 'SSS', key: 'sss', width: 12 },
        { header: 'PhilHealth', key: 'philhealth', width: 12 },
        { header: 'Pag-IBIG', key: 'pagibig', width: 12 },
        { header: 'Tax', key: 'tax', width: 12 },
        { header: 'Manual Deductions', key: 'manualDeductions', width: 15 },
        { header: 'Net Pay', key: 'netPay', width: 15 },
      ];

      // Add data rows
      data.forEach((row) => {
        worksheet.addRow(row);
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Format number columns
      const numberColumns = [
        'basicSalary',
        'late',
        'undertime',
        'absent',
        'basicPay',
        'allowancePay',
        'holidayPay',
        'overtimePay',
        'nightDifferentialPay',
        'restDayPay',
        'manualEarnings',
        'grossPay',
        'sss',
        'philhealth',
        'pagibig',
        'tax',
        'manualDeductions',
        'netPay',
      ];

      numberColumns.forEach((col) => {
        const column = worksheet.getColumn(col);
        column.numFmt = '#,##0.00';
      });

      // Add borders to all cells
      worksheet.eachRow((row, _rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Add title and period information
      worksheet.insertRow(1, [`Payroll Summary Report`]);
      worksheet.insertRow(2, [
        `Period: ${cutoffDateRange.startDate.toLocaleDateString()} - ${cutoffDateRange.endDate.toLocaleDateString()}`,
      ]);
      worksheet.insertRow(3, []);

      // Merge cells for title
      worksheet.mergeCells('A1:V1');
      worksheet.mergeCells('A2:V2');

      // Style title
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.getCell('A2').font = { size: 12 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // Generate buffer
      return await workbook.xlsx.writeBuffer();
    }

    // Return data array for CSV format
    return data;
  }
}
