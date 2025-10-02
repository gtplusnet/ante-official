import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableResponse } from '@shared/response/table.response';
import { Prisma, EmploymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  EmployeeLeavePlanResponse,
  EmployeeLeavePlanListResponse,
  EmployeeAssignmentResponse,
  EligibleEmployee,
  EmployeeCredits,
  EmployeeLeaveInfo,
  EmployeeLeavePlanDates,
  EmployeeLeavePlanStatus,
  EmployeeLeavePlanPlan,
  EmployeeLeaveSettings,
  LeaveCreditHistoryEntry,
  HistorySummaryResponse,
  EmployeeAllHistoryResponse,
  BulkCreditAdjustmentResponse,
} from '@shared/response/employee-leave-plan-response.interface';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Injectable()
export class EmployeeLeavePlanService {
  @Inject() private tableHandlerService: TableHandlerService;

  constructor(
    private prisma: PrismaService,
    private utilityService: UtilityService,
  ) {}

  // Helper method to get standard includes for employee leave plan queries
  private getStandardEmployeeLeavePlanInclude(includeHistory = false) {
    const include: any = {
      employee: {
        select: {
          accountId: true,
          employeeCode: true,
          account: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              email: true,
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          payrollGroup: {
            select: {
              id: true,
              payrollGroupCode: true,
            },
          },
          activeContract: {
            select: {
              employmentStatus: true,
              startDate: true,
            },
          },
        },
      },
      leavePlan: {
        include: {
          leaveTypeConfiguration: true,
        },
      },
    };

    if (includeHistory) {
      include.leaveCreditHistory = {
        where: {
          transactionType: {
            in: ['CREDIT', 'INITIAL'],
          },
        },
      };
    }

    return include;
  }

  async assignEmployeesToPlan(
    data: {
      leavePlanId: number;
      employees: Array<{
        accountId: string;
        totalAnnualCredits: number;
        monthlyAccrualCredits: number;
        initialLeaveCredits: number;
        leaveCreditsGivenUpfront: number;
        monthDayCreditsAccrual?: number;
      }>;
    },
    currentUserAccountId: string,
  ): Promise<EmployeeAssignmentResponse> {
    // Get leave plan details
    const leavePlan = await this.prisma.leavePlan.findUnique({
      where: { id: data.leavePlanId },
      include: {
        leaveTypeConfiguration: true,
      },
    });

    if (!leavePlan) {
      throw new BadRequestException(
        `Leave plan with ID ${data.leavePlanId} not found`,
      );
    }

    // Validate all employees exist and belong to the current company
    const accountIds = data.employees.map((emp) => emp.accountId);
    const existingEmployees = await this.prisma.employeeData.findMany({
      where: {
        accountId: { in: accountIds },
      },
      include: {
        account: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Check for non-existent employees
    const existingAccountIds = existingEmployees.map((emp) => emp.accountId);
    const missingAccountIds = accountIds.filter(
      (id) => !existingAccountIds.includes(id),
    );

    if (missingAccountIds.length > 0) {
      throw new BadRequestException(
        `Employee not found: ${missingAccountIds.join(', ')}`,
      );
    }

    // Check for employees from other companies
    const wrongCompanyEmployees = existingEmployees.filter(
      (emp) => emp.account.companyId !== this.utilityService.companyId,
    );

    if (wrongCompanyEmployees.length > 0) {
      const wrongAccountIds = wrongCompanyEmployees.map((emp) => emp.accountId);
      throw new BadRequestException(
        `Employee not found in this company: ${wrongAccountIds.join(', ')}`,
      );
    }

    // Check for existing assignments
    const existingAssignments = await this.prisma.employeeLeavePlan.findMany({
      where: {
        leavePlanId: data.leavePlanId,
        accountId: { in: accountIds },
      },
      select: {
        accountId: true,
        isActive: true,
      },
    });

    if (existingAssignments.length > 0) {
      const alreadyAssignedAccounts = existingAssignments.map((assignment) => {
        const employee = existingEmployees.find(
          (emp) => emp.accountId === assignment.accountId,
        );
        const fullName = employee
          ? `${employee.account.firstName} ${employee.account.lastName}`
          : assignment.accountId;
        return `${fullName} (${assignment.isActive ? 'active' : 'inactive'})`;
      });

      throw new BadRequestException(
        `The following employees are already assigned to this leave plan: ${alreadyAssignedAccounts.join(', ')}`,
      );
    }

    const createPromises = data.employees.map(async (employee) => {
      // Use current date as effective date
      const effectiveDate = new Date();

      // Use the initial credits for first-time assignment
      const initialCredits = employee.initialLeaveCredits || 0;

      // Create employee leave plan
      const employeeLeavePlan = await this.prisma.employeeLeavePlan.create({
        data: {
          leavePlanId: data.leavePlanId,
          accountId: employee.accountId,
          effectiveDate: effectiveDate,
          currentCredits: new Decimal(initialCredits),
          totalAnnualCredits: new Decimal(employee.totalAnnualCredits),
          monthlyAccrualCredits: new Decimal(employee.monthlyAccrualCredits),
          monthDayCreditsAccrual: employee.monthDayCreditsAccrual || 22,
          leaveCreditsGivenUpfront: new Decimal(
            employee.leaveCreditsGivenUpfront || 0,
          ),
          renewalType: leavePlan.renewalType,
          customRenewalDate: leavePlan.customRenewalDate,
        },
        include: this.getStandardEmployeeLeavePlanInclude(),
      });

      // Create initial credit history entry only if there are initial credits
      if (initialCredits > 0) {
        await this.prisma.leaveCreditHistory.create({
          data: {
            employeeLeavePlanId: employeeLeavePlan.id,
            transactionType: 'INITIAL',
            amount: new Decimal(initialCredits),
            balanceBefore: new Decimal(0),
            balanceAfter: new Decimal(initialCredits),
            reason: `Initial credit allocation on assignment to ${leavePlan.planName}`,
            createdBy: currentUserAccountId,
          },
        });
      }

      return employeeLeavePlan;
    });

    const assignments = await Promise.all(createPromises);

    return this.formatAssignmentResponse(assignments, leavePlan);
  }

  /**
   * @deprecated This method is no longer used. Initial credits are now provided directly via leaveCreditsGivenUpfront parameter.
   */
  private calculateInitialCredits(
    effectiveDate: Date,
    totalAnnualCredits: number,
    monthlyAccrualCredits: number,
  ): number {
    const now = new Date();
    const effective = new Date(effectiveDate);

    // If effective date is in the future, no credits yet
    if (effective > now) {
      return 0;
    }

    // Calculate months since effective date
    const monthsDiff =
      (now.getFullYear() - effective.getFullYear()) * 12 +
      (now.getMonth() - effective.getMonth());

    // If within the same year, calculate prorated credits
    if (effective.getFullYear() === now.getFullYear()) {
      // Prorated annual credits based on remaining months in the year
      const remainingMonths = 12 - effective.getMonth();
      const proratedAnnual = (totalAnnualCredits / 12) * remainingMonths;

      // Add monthly accruals for completed months
      const accruedCredits = monthlyAccrualCredits * Math.max(0, monthsDiff);

      return proratedAnnual + accruedCredits;
    }

    // If past years, give full annual credits plus accruals
    return (
      totalAnnualCredits + monthlyAccrualCredits * Math.min(monthsDiff, 12)
    );
  }

  async updateEmployeeCredits(
    id: number,
    credits: {
      currentCredits?: number;
      usedCredits?: number;
      carriedCredits?: number;
    },
  ): Promise<EmployeeLeavePlanResponse> {
    // Validate that the employee leave plan exists
    const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!employeePlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${id} not found`,
      );
    }

    const updateData: any = {};

    if (credits.currentCredits !== undefined) {
      updateData.currentCredits = new Decimal(credits.currentCredits);
    }

    if (credits.usedCredits !== undefined) {
      updateData.usedCredits = new Decimal(credits.usedCredits);
    }

    if (credits.carriedCredits !== undefined) {
      updateData.carriedCredits = new Decimal(credits.carriedCredits);
    }

    const updatedPlan = await this.prisma.employeeLeavePlan.update({
      where: { id },
      data: updateData,
      include: this.getStandardEmployeeLeavePlanInclude(),
    });

    return this.formatEmployeeLeavePlan(updatedPlan);
  }

  async deactivateEmployeePlan(id: number): Promise<EmployeeLeavePlanResponse> {
    const deactivatedPlan = await this.prisma.employeeLeavePlan.update({
      where: { id },
      data: { isActive: false },
      include: this.getStandardEmployeeLeavePlanInclude(),
    });

    return this.formatEmployeeLeavePlan(deactivatedPlan);
  }

  async activateEmployeePlan(id: number): Promise<EmployeeLeavePlanResponse> {
    // Validate that the employee leave plan exists
    const existingPlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!existingPlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${id} not found`,
      );
    }

    // Verify the employee belongs to the current company
    if (
      existingPlan.employee.account.companyId !== this.utilityService.companyId
    ) {
      throw new BadRequestException(`Employee leave plan not found`);
    }

    // Check if already active
    if (existingPlan.isActive) {
      throw new BadRequestException(`Employee leave plan is already active`);
    }

    // Activate the plan
    const activatedPlan = await this.prisma.employeeLeavePlan.update({
      where: { id },
      data: { isActive: true },
      include: this.getStandardEmployeeLeavePlanInclude(),
    });

    return this.formatEmployeeLeavePlan(activatedPlan);
  }

  async getEmployeeLeavePlans(
    accountId: string,
  ): Promise<EmployeeLeavePlanListResponse> {
    const employeePlans = await this.prisma.employeeLeavePlan.findMany({
      where: {
        accountId,
        isActive: true,
      },
      include: this.getStandardEmployeeLeavePlanInclude(true), // Include history for calculating totalAccumulated
    });

    return this.formatEmployeeLeavePlanList(employeePlans);
  }

  async getEligibleEmployeesForPlan(
    leavePlanId: number,
    filters?: EmployeeSelectionFilterDto,
  ): Promise<any[]> {
    // Get all employees who don't have this leave plan assigned yet
    const existingAssignments = await this.prisma.employeeLeavePlan.findMany({
      where: {
        leavePlanId,
        isActive: true,
      },
      select: {
        accountId: true,
      },
    });

    const assignedAccountIds = existingAssignments.map((a) => a.accountId);

    // Build where clause with filters
    const whereClause: Prisma.EmployeeDataWhereInput = {
      account: {
        companyId: this.utilityService.companyId,
      },
    };

    // Apply exclusion filter (combine existing assignments with any excluded IDs from filters)
    const allExcludedIds = [
      ...assignedAccountIds,
      ...(filters?.excludeAccountIds || []),
    ];
    if (allExcludedIds.length > 0) {
      whereClause.NOT = {
        accountId: {
          in: allExcludedIds,
        },
      };
    }

    // Apply branch filter
    if (filters?.branch && filters.branch !== 'all') {
      // Handle both single string and array of branch IDs
      if (Array.isArray(filters.branch)) {
        // Multiple branches - use IN operator
        whereClause.branchId = {
          in: filters.branch
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id)),
        };
      } else {
        // Single branch - backward compatibility
        const branchId = parseInt(filters.branch, 10);
        if (!isNaN(branchId)) {
          whereClause.branchId = branchId;
        }
      }
    }

    // Apply role filter
    if (filters?.role && filters.role !== 'all') {
      whereClause.account = {
        ...(whereClause.account as any),
        roleId: filters.role,
      };
    }

    // Apply employment status filter
    if (filters?.employmentStatus && filters.employmentStatus !== 'all') {
      // Map string to enum value
      const statusMap: Record<string, EmploymentStatus> = {
        REGULAR: EmploymentStatus.REGULAR,
        CONTRACTUAL: EmploymentStatus.CONTRACTTUAL,
        CONTRACTTUAL: EmploymentStatus.CONTRACTTUAL,
        PROBATIONARY: EmploymentStatus.PROBATIONARY,
        TRAINEE: EmploymentStatus.TRAINEE,
      };

      const enumValue = statusMap[filters.employmentStatus.toUpperCase()];
      if (enumValue) {
        whereClause.activeContract = {
          employmentStatus: enumValue,
        };
      }
    }

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      whereClause.OR = [
        {
          account: {
            firstName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        },
        {
          account: {
            lastName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        },
        {
          employeeCode: {
            contains: searchLower,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Fetch employees with all necessary relations
    const employees = await this.prisma.employeeData.findMany({
      where: whereClause,
      include: {
        account: {
          include: {
            role: true,
          },
        },
        branch: true,
        activeContract: true,
        payrollGroup: true,
      },
      orderBy: [
        {
          account: {
            lastName: 'asc',
          },
        },
        {
          account: {
            firstName: 'asc',
          },
        },
      ],
    });

    // Format responses to match EmployeeDataResponse format
    const response: any[] = employees.map((employee: any) => {
      const account = employee.account;
      const fullName = [account.firstName, account.middleName, account.lastName]
        .filter(Boolean)
        .join(' ');

      return {
        employeeCode: employee.employeeCode,
        accountDetails: {
          id: account.id,
          companyId: account.companyId,
          firstName: account.firstName,
          middleName: account.middleName || null,
          lastName: account.lastName,
          suffix: account.suffix || null,
          fullName: fullName,
          email: account.email,
          role: account.role
            ? {
                id: account.role.id,
                name: account.role.name,
              }
            : null,
        },
        contractDetails: employee.activeContract
          ? {
              id: employee.activeContract.id,
              position: employee.position || null,
              employmentStatus: employee.activeContract.employmentStatus,
              startDate: this.utilityService.formatDate(
                employee.activeContract.startDate,
              ),
              endDate: employee.activeContract.endDate
                ? this.utilityService.formatDate(
                    employee.activeContract.endDate,
                  )
                : null,
            }
          : null,
        payrollGroup: employee.payrollGroup
          ? {
              id: employee.payrollGroup.id,
              payrollGroupCode: employee.payrollGroup.payrollGroupCode,
              basedOn: employee.payrollGroup.basedOn,
              payPeriod: employee.payrollGroup.payPeriod,
            }
          : null,
        schedule: null,
        branch: employee.branch
          ? {
              id: employee.branch.id,
              name: employee.branch.name,
              code: employee.branch.code || null,
            }
          : null,
      };
    });

    return response;
  }

  async getEmployeesByLeavePlan(
    leavePlanId: number,
    isActive = true,
  ): Promise<EmployeeLeavePlanListResponse> {
    const employeePlans = await this.prisma.employeeLeavePlan.findMany({
      where: {
        leavePlanId,
        isActive,
      },
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
      },
    });

    return this.formatEmployeeLeavePlanList(employeePlans);
  }

  async getEmployeesByLeavePlanTable(
    leavePlanId: number,
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<EmployeeLeavePlanResponse>> {
    // Ensure body has proper defaults for table handler
    const tableBody = {
      ...body,
      settings: {
        defaultOrderBy: 'createdAt',
        defaultOrderType: 'desc',
        sort: [],
        filter: [],
        ...body.settings,
      },
    };

    // Initialize table handler with the employee leave plan table configuration
    this.tableHandlerService.initialize(query, tableBody, 'employeeLeavePlan');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    // Add specific where conditions
    tableQuery['where'] = {
      ...tableQuery['where'],
      leavePlanId,
      employee: {
        account: {
          companyId: this.utilityService.companyId,
        },
      },
    };

    // Add necessary includes for formatting
    tableQuery['include'] = this.getStandardEmployeeLeavePlanInclude();

    // Get paginated data
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.employeeLeavePlan,
      query,
      tableQuery,
    );

    // Format the response
    const formattedList = baseList.map((employeePlan: any) =>
      this.formatEmployeeLeavePlan(employeePlan),
    );

    // Get total count for the table
    const totalCount = await this.prisma.employeeLeavePlan.count({
      where: {
        leavePlanId,
        employee: {
          account: {
            companyId: this.utilityService.companyId,
          },
        },
      },
    });

    return {
      list: formattedList,
      pagination,
      currentPage,
      totalCount,
    };
  }

  // Private formatting methods
  private formatEmployeeCredits(employeePlan: any): EmployeeCredits {
    const currentNum = employeePlan.currentCredits
      ? parseFloat(employeePlan.currentCredits.toString())
      : 0;
    const usedNum = employeePlan.usedCredits
      ? parseFloat(employeePlan.usedCredits.toString())
      : 0;
    const carriedNum = employeePlan.carriedCredits
      ? parseFloat(employeePlan.carriedCredits.toString())
      : 0;

    const remainingNum = currentNum - usedNum;
    const totalNum = currentNum + carriedNum;

    // Calculate total accumulated from history (excluding returned credits from cancelled/rejected leaves)
    let totalAccumulatedNum = 0;
    if (
      employeePlan.leaveCreditHistory &&
      Array.isArray(employeePlan.leaveCreditHistory)
    ) {
      totalAccumulatedNum = employeePlan.leaveCreditHistory
        .filter((entry: any) => {
          // Include INITIAL credits
          if (entry.transactionType === 'INITIAL') return true;

          // Include CREDIT transactions but exclude returns from cancelled/rejected leaves
          if (entry.transactionType === 'CREDIT') {
            const refId = entry.referenceId || '';
            return !refId.includes('CANCELLED') && !refId.includes('REJECTED');
          }

          return false;
        })
        .reduce(
          (sum: number, entry: any) =>
            sum + parseFloat(entry.amount.toString()),
          0,
        );
    }

    // If no history available, use the current total as fallback
    if (totalAccumulatedNum === 0) {
      totalAccumulatedNum = totalNum;
    }

    const current = this.utilityService.formatNumber(currentNum, 2).toString();
    const used = this.utilityService.formatNumber(usedNum, 2).toString();
    const carried = this.utilityService.formatNumber(carriedNum, 2).toString();
    const remaining = this.utilityService
      .formatNumber(remainingNum, 2)
      .toString();
    const total = this.utilityService.formatNumber(totalNum, 2).toString();
    const totalAccumulated = this.utilityService
      .formatNumber(totalAccumulatedNum, 2)
      .toString();

    return {
      current,
      used,
      carried,
      remaining,
      total,
      totalAccumulated,
      formatted: {
        current: `${current} days`,
        used: `${used} days`,
        carried: `${carried} days`,
        remaining: `${remaining} days`,
        total: `${total} days`,
        totalAccumulated: `${totalAccumulated} days`,
      },
    };
  }

  private formatEmployeeInfo(employee: any): EmployeeLeaveInfo {
    const account = employee.account;
    const fullName = [account.firstName, account.middleName, account.lastName]
      .filter(Boolean)
      .join(' ');

    return {
      accountId: account.id,
      employeeCode: employee.employeeCode,
      name: fullName,
      email: account.email,
      department: employee.branch?.name || 'N/A',
      position: 'N/A', // Position field not available in current schema
      role: account.role?.name || 'N/A',
      payrollGroup: employee.payrollGroup?.payrollGroupCode || 'N/A',
      employmentStatus: employee.activeContract?.employmentStatus || 'N/A',
      hireDate: employee.activeContract?.startDate
        ? this.utilityService.formatDate(employee.activeContract.startDate)
        : null,
    };
  }

  private formatEmployeeLeavePlanDates(
    employeePlan: any,
  ): EmployeeLeavePlanDates {
    return {
      effectiveDate: this.utilityService.formatDate(employeePlan.effectiveDate),
      createdAt: this.utilityService.formatDate(employeePlan.createdAt),
      updatedAt: this.utilityService.formatDate(employeePlan.updatedAt),
    };
  }

  private formatEmployeeLeavePlanStatus(
    isActive: boolean,
  ): EmployeeLeavePlanStatus {
    return {
      isActive,
      label: isActive ? 'Active' : 'Inactive',
      badge: isActive ? 'success' : 'danger',
    };
  }

  private formatEmployeeLeaveSettings(
    employeePlan: any,
  ): EmployeeLeaveSettings {
    const totalAnnualNum = employeePlan.totalAnnualCredits
      ? parseFloat(employeePlan.totalAnnualCredits.toString())
      : 0;
    const monthlyAccrualNum = employeePlan.monthlyAccrualCredits
      ? parseFloat(employeePlan.monthlyAccrualCredits.toString())
      : 0;
    const leaveCreditsGivenUpfrontNum = employeePlan.leaveCreditsGivenUpfront
      ? parseFloat(employeePlan.leaveCreditsGivenUpfront.toString())
      : 0;

    return {
      totalAnnualCredits: this.utilityService
        .formatNumber(totalAnnualNum, 2)
        .toString(),
      monthlyAccrualCredits: this.utilityService
        .formatNumber(monthlyAccrualNum, 2)
        .toString(),
      monthDayCreditsAccrual: employeePlan.monthDayCreditsAccrual,
      leaveCreditsGivenUpfront: this.utilityService
        .formatNumber(leaveCreditsGivenUpfrontNum, 2)
        .toString(),
      renewalType: employeePlan.renewalType,
      customRenewalDate: employeePlan.customRenewalDate
        ? this.utilityService.formatDate(employeePlan.customRenewalDate)
        : null,
    };
  }

  private formatEmployeeLeavePlanPlan(leavePlan: any): EmployeeLeavePlanPlan {
    const monthlyAccrualNum = leavePlan.monthlyAccrualCredits
      ? parseFloat(leavePlan.monthlyAccrualCredits.toString())
      : 0;
    const monthlyAccrual = this.utilityService
      .formatNumber(monthlyAccrualNum, 2)
      .toString();

    const renewalLabels = {
      HIRING_ANNIVERSARY: 'Hiring Anniversary',
      START_OF_YEAR: 'Start of Year',
      MONTHLY: 'Monthly',
      CUSTOM_DATE: 'Custom Date',
    };

    return {
      id: leavePlan.id,
      planName: leavePlan.planName,
      leaveType: {
        id: leavePlan.leaveTypeConfiguration.id,
        name: leavePlan.leaveTypeConfiguration.name,
        code: leavePlan.leaveTypeConfiguration.code,
      },
      monthlyAccrual: `${monthlyAccrual} days/month`,
      renewalType:
        renewalLabels[leavePlan.renewalType] || leavePlan.renewalType,
      rules: {
        canCarryOver: leavePlan.canCarryOver,
        maxCarryOverCredits: leavePlan.maxCarryOverCredits,
        canConvertToCash: leavePlan.canConvertToCash,
        maxCashConversionCredits: leavePlan.maxCashConversionCredits,
        canFileSameDay: leavePlan.canFileSameDay,
        allowLateFiling: leavePlan.allowLateFiling,
        advanceFilingDays: leavePlan.advanceFilingDays,
        maxConsecutiveDays: leavePlan.maxConsecutiveDays,
        canFileAgainstFutureCredits: leavePlan.canFileAgainstFutureCredits,
        maxAdvanceFilingDays: leavePlan.maxAdvanceFilingDays,
        isAttachmentMandatory: leavePlan.isAttachmentMandatory,
        isLimitedConsecutiveFilingDays:
          leavePlan.isLimitedConsecutiveFilingDays,
        consecutiveFilingDays: leavePlan.consecutiveFilingDays,
      },
      customRenewalDate: leavePlan.customRenewalDate
        ? this.utilityService.formatDate(leavePlan.customRenewalDate)
        : null,
    };
  }

  private formatEmployeeLeavePlan(
    employeePlan: any,
  ): EmployeeLeavePlanResponse {
    return {
      id: employeePlan.id,
      employee: this.formatEmployeeInfo(employeePlan.employee),
      plan: this.formatEmployeeLeavePlanPlan(employeePlan.leavePlan),
      credits: this.formatEmployeeCredits(employeePlan),
      settings: this.formatEmployeeLeaveSettings(employeePlan),
      dates: this.formatEmployeeLeavePlanDates(employeePlan),
      status: this.formatEmployeeLeavePlanStatus(employeePlan.isActive),
    };
  }

  private formatEmployeeLeavePlanList(
    employeePlans: any[],
  ): EmployeeLeavePlanListResponse {
    const formattedPlans = employeePlans.map((plan) =>
      this.formatEmployeeLeavePlan(plan),
    );

    const activeCount = formattedPlans.filter(
      (plan) => plan.status.isActive,
    ).length;
    const inactiveCount = formattedPlans.length - activeCount;

    const totalCreditsAllocated = formattedPlans.reduce((sum, plan) => {
      return sum + parseFloat(plan.credits.current);
    }, 0);

    const totalCreditsUsed = formattedPlans.reduce((sum, plan) => {
      return sum + parseFloat(plan.credits.used);
    }, 0);

    const totalCreditsRemaining = totalCreditsAllocated - totalCreditsUsed;

    return {
      employeePlans: formattedPlans,
      total: formattedPlans.length,
      metadata: {
        activeCount,
        inactiveCount,
        totalCreditsAllocated: this.utilityService
          .formatNumber(totalCreditsAllocated, 2)
          .toString(),
        totalCreditsUsed: this.utilityService
          .formatNumber(totalCreditsUsed, 2)
          .toString(),
        totalCreditsRemaining: this.utilityService
          .formatNumber(totalCreditsRemaining, 2)
          .toString(),
      },
    };
  }

  private formatAssignmentResponse(
    assignments: any[],
    leavePlan: any,
  ): EmployeeAssignmentResponse {
    const formattedAssignments = assignments.map((assignment) =>
      this.formatEmployeeLeavePlan(assignment),
    );

    const totalCreditsAllocated = assignments.reduce((sum, assignment) => {
      const credits = assignment.currentCredits
        ? parseFloat(assignment.currentCredits.toString())
        : 0;
      return sum + credits;
    }, 0);

    return {
      leavePlanId: leavePlan.id,
      planName: leavePlan.planName,
      leaveTypeName: leavePlan.leaveTypeConfiguration.name,
      assignedEmployees: formattedAssignments,
      summary: {
        totalAssigned: assignments.length,
        successfulAssignments: assignments.length,
        failedAssignments: 0,
        totalCreditsAllocated: this.utilityService
          .formatNumber(totalCreditsAllocated, 2)
          .toString(),
      },
    };
  }

  private formatEligibleEmployees(employees: any[]): EligibleEmployee[] {
    return employees.map((employee) => {
      const account = employee.account;
      const fullName = [account.firstName, account.middleName, account.lastName]
        .filter(Boolean)
        .join(' ');

      const currentAssignments = employee.employeeLeavePlans.map(
        (elp: any) => ({
          planName: elp.leavePlan.planName,
          leaveTypeName: elp.leavePlan.leaveTypeConfiguration.name,
          isActive: elp.isActive,
        }),
      );

      return {
        accountId: account.id,
        name: fullName,
        department: employee.branch?.name || 'N/A',
        position: employee.position || 'N/A',
        hireDate: this.utilityService.formatDate(employee.hireDate),
        currentAssignments,
        isEligible: true,
        ineligibilityReason: undefined,
      };
    });
  }

  async getCreditHistory(employeeLeavePlanId: number): Promise<any> {
    const history = await this.prisma.leaveCreditHistory.findMany({
      where: { employeeLeavePlanId },
      orderBy: { createdAt: 'desc' },
    });

    return history.map((entry) => ({
      id: entry.id,
      transactionType: entry.transactionType,
      amount: this.utilityService.formatNumber(
        parseFloat(entry.amount.toString()),
        2,
      ),
      balanceBefore: this.utilityService.formatNumber(
        parseFloat(entry.balanceBefore.toString()),
        2,
      ),
      balanceAfter: this.utilityService.formatNumber(
        parseFloat(entry.balanceAfter.toString()),
        2,
      ),
      reason: entry.reason,
      referenceId: entry.referenceId,
      createdBy: entry.createdBy,
      createdAt: this.utilityService.formatDate(entry.createdAt),
    }));
  }

  async adjustCredits(
    employeeLeavePlanId: number,
    data: {
      amount: number;
      reason: string;
      transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
      referenceId?: string;
    },
    currentUserAccountId: string,
  ): Promise<any> {
    // Get current employee leave plan
    const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id: employeeLeavePlanId },
    });

    if (!employeePlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${employeeLeavePlanId} not found`,
      );
    }

    const currentBalance = parseFloat(employeePlan.currentCredits.toString());
    let newBalance: number;
    let actualAmount: number;

    switch (data.transactionType) {
      case 'CREDIT':
        actualAmount = Math.abs(data.amount);
        newBalance = currentBalance + actualAmount;
        break;
      case 'DEBIT':
        actualAmount = -Math.abs(data.amount);
        newBalance = currentBalance + actualAmount;
        break;
      case 'ADJUSTMENT':
        actualAmount = data.amount;
        newBalance = currentBalance + actualAmount;
        break;
    }

    if (newBalance < 0) {
      throw new BadRequestException(
        'Insufficient credits. Balance cannot be negative.',
      );
    }

    // Update employee leave plan
    await this.prisma.employeeLeavePlan.update({
      where: { id: employeeLeavePlanId },
      data: { currentCredits: new Decimal(newBalance) },
    });

    // Create history entry
    const historyEntry = await this.prisma.leaveCreditHistory.create({
      data: {
        employeeLeavePlanId,
        transactionType: data.transactionType,
        amount: new Decimal(actualAmount),
        balanceBefore: new Decimal(currentBalance),
        balanceAfter: new Decimal(newBalance),
        reason: data.reason,
        referenceId: data.referenceId,
        createdBy: currentUserAccountId,
      },
    });

    return {
      success: true,
      message: 'Credits adjusted successfully',
      history: {
        transactionType: historyEntry.transactionType,
        amount: this.utilityService.formatNumber(Math.abs(actualAmount), 2),
        balanceBefore: this.utilityService.formatNumber(currentBalance, 2),
        balanceAfter: this.utilityService.formatNumber(newBalance, 2),
        reason: historyEntry.reason,
        createdAt: this.utilityService.formatDate(historyEntry.createdAt),
      },
    };
  }

  async updateLeaveSettings(
    employeeLeavePlanId: number,
    data: {
      totalAnnualCredits?: number;
      monthlyAccrualCredits?: number;
      monthDay?: number;
      leaveCreditsGivenUpfront?: number;
    },
  ): Promise<any> {
    // Validate that the employee leave plan exists
    const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id: employeeLeavePlanId },
      include: {
        employee: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!employeePlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${employeeLeavePlanId} not found`,
      );
    }

    const updateData: any = {};

    if (data.totalAnnualCredits !== undefined) {
      updateData.totalAnnualCredits = new Decimal(data.totalAnnualCredits);
    }
    if (data.monthlyAccrualCredits !== undefined) {
      updateData.monthlyAccrualCredits = new Decimal(
        data.monthlyAccrualCredits,
      );
    }
    if (data.monthDay !== undefined) {
      updateData.monthDayCreditsAccrual = data.monthDay;
    }
    if (data.leaveCreditsGivenUpfront !== undefined) {
      updateData.leaveCreditsGivenUpfront = new Decimal(
        data.leaveCreditsGivenUpfront,
      );
    }

    const updated = await this.prisma.employeeLeavePlan.update({
      where: { id: employeeLeavePlanId },
      data: updateData,
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
      },
    });

    return this.formatEmployeeLeavePlan(updated);
  }

  async getCreditHistoryTable(
    employeeLeavePlanId: number,
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<LeaveCreditHistoryEntry>> {
    // Ensure body has proper defaults for table handler
    const tableBody = {
      ...body,
      settings: {
        defaultOrderBy: 'createdAt',
        defaultOrderType: 'desc',
        sort: [],
        filter: [],
        ...body.settings,
      },
    };

    // Initialize table handler - the table configuration comes from body.settings
    this.tableHandlerService.initialize(query, tableBody, 'leaveCreditHistory');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    // Add specific where conditions
    tableQuery['where'] = {
      ...tableQuery['where'],
      employeeLeavePlanId,
    };

    // Get paginated data
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.leaveCreditHistory,
      query,
      tableQuery,
    );

    // Format the response
    const formattedList = baseList.map((entry: any) =>
      this.formatCreditHistoryEntry(entry),
    );

    // Get total count - should use the same where clause as the main query
    const totalCount = await this.prisma.leaveCreditHistory.count({
      where: tableQuery['where'],
    });

    return {
      list: formattedList,
      pagination,
      currentPage,
      totalCount,
    };
  }

  async getEmployeeAllHistory(
    accountId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      leavePlanId?: number;
    },
  ): Promise<EmployeeAllHistoryResponse> {
    // Get employee info
    const employee = await this.prisma.employeeData.findUnique({
      where: { accountId },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            companyId: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (
      !employee ||
      employee.account.companyId !== this.utilityService.companyId
    ) {
      throw new BadRequestException('Employee not found');
    }

    // Build where clause for history
    const historyWhere: any = {
      employeeLeavePlan: {
        accountId,
        employee: {
          account: {
            companyId: this.utilityService.companyId,
          },
        },
      },
    };

    if (filters.leavePlanId) {
      historyWhere.employeeLeavePlan.leavePlanId = filters.leavePlanId;
    }

    if (filters.startDate) {
      historyWhere.createdAt = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      historyWhere.createdAt = {
        ...historyWhere.createdAt,
        lte: new Date(filters.endDate),
      };
    }

    // Get all employee leave plans with history
    const employeePlans = await this.prisma.employeeLeavePlan.findMany({
      where: {
        accountId,
        employee: {
          account: {
            companyId: this.utilityService.companyId,
          },
        },
        ...(filters.leavePlanId && { leavePlanId: filters.leavePlanId }),
      },
      include: {
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
        leaveCreditHistory: {
          where: {
            ...(filters.startDate && {
              createdAt: { gte: new Date(filters.startDate) },
            }),
            ...(filters.endDate && {
              createdAt: { lte: new Date(filters.endDate) },
            }),
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Format response
    const leavePlans = employeePlans.map((plan) => ({
      leavePlanId: plan.leavePlanId,
      planName: plan.leavePlan.planName,
      leaveType: plan.leavePlan.leaveTypeConfiguration.name,
      currentCredits: this.utilityService
        .formatNumber(parseFloat(plan.currentCredits.toString()), 2)
        .toString(),
      totalTransactions: plan.leaveCreditHistory.length,
      history: plan.leaveCreditHistory.map((entry) =>
        this.formatCreditHistoryEntry(entry),
      ),
    }));

    // Calculate summary
    const allHistory = employeePlans.flatMap((plan) => plan.leaveCreditHistory);
    const totalCreditsReceived = allHistory
      .filter((h) => {
        // Include INITIAL credits
        if (h.transactionType === 'INITIAL') return true;

        // Include CREDIT transactions but exclude returns from cancelled/rejected leaves
        if (h.transactionType === 'CREDIT') {
          const refId = h.referenceId || '';
          return !refId.includes('CANCELLED') && !refId.includes('REJECTED');
        }

        return false;
      })
      .reduce((sum, h) => sum + parseFloat(h.amount.toString()), 0);
    const totalCreditsUsed = allHistory
      .filter((h) => h.transactionType === 'DEBIT')
      .reduce((sum, h) => sum + Math.abs(parseFloat(h.amount.toString())), 0);
    const totalAdjustments = allHistory
      .filter((h) => h.transactionType === 'ADJUSTMENT')
      .reduce((sum, h) => sum + parseFloat(h.amount.toString()), 0);
    const currentBalance = employeePlans.reduce(
      (sum, plan) => sum + parseFloat(plan.currentCredits.toString()),
      0,
    );

    return {
      employee: this.formatEmployeeInfo(employee),
      leavePlans,
      summary: {
        totalCreditsReceived: this.utilityService
          .formatNumber(totalCreditsReceived, 2)
          .toString(),
        totalCreditsUsed: this.utilityService
          .formatNumber(totalCreditsUsed, 2)
          .toString(),
        totalAdjustments: this.utilityService
          .formatNumber(totalAdjustments, 2)
          .toString(),
        currentBalance: this.utilityService
          .formatNumber(currentBalance, 2)
          .toString(),
      },
    };
  }

  async getCreditHistorySummary(
    employeeLeavePlanId: number,
    filters: {
      year?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<HistorySummaryResponse> {
    // Get employee leave plan
    const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id: employeeLeavePlanId },
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
      },
    });

    if (!employeePlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${employeeLeavePlanId} not found`,
      );
    }

    // Build date filters
    let startDate: Date;
    let endDate: Date;

    if (filters.year) {
      startDate = new Date(filters.year, 0, 1);
      endDate = new Date(filters.year, 11, 31, 23, 59, 59);
    } else {
      startDate = filters.startDate
        ? new Date(filters.startDate)
        : new Date(new Date().getFullYear(), 0, 1);
      endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    }

    // Get history within date range
    const history = await this.prisma.leaveCreditHistory.findMany({
      where: {
        employeeLeavePlanId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics by transaction type
    const byTransactionType: Record<
      string,
      { count: number; totalAmount: string }
    > = {};
    let netChange = 0;

    history.forEach((entry) => {
      const amount = parseFloat(entry.amount.toString());
      const type = entry.transactionType;

      if (!byTransactionType[type]) {
        byTransactionType[type] = { count: 0, totalAmount: '0' };
      }

      byTransactionType[type].count++;
      const currentTotal = parseFloat(byTransactionType[type].totalAmount);
      byTransactionType[type].totalAmount = this.utilityService
        .formatNumber(currentTotal + amount, 2)
        .toString();

      netChange += amount;
    });

    return {
      employeeLeavePlan: {
        id: employeePlan.id,
        employee: this.formatEmployeeInfo(employeePlan.employee),
        leavePlan: {
          planName: employeePlan.leavePlan.planName,
          leaveType: employeePlan.leavePlan.leaveTypeConfiguration.name,
        },
        currentCredits: this.utilityService
          .formatNumber(parseFloat(employeePlan.currentCredits.toString()), 2)
          .toString(),
      },
      summary: {
        totalTransactions: history.length,
        byTransactionType,
        netChange: this.utilityService.formatNumber(netChange, 2).toString(),
        period: {
          startDate: this.utilityService.formatDate(startDate).dateFull,
          endDate: this.utilityService.formatDate(endDate).dateFull,
          ...(filters.year && { year: filters.year }),
        },
      },
    };
  }

  async exportCreditHistory(
    employeeLeavePlanId: number,
    filters: {
      format?: 'excel';
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Buffer> {
    // Get employee leave plan info
    const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
      where: { id: employeeLeavePlanId },
      include: {
        employee: {
          include: {
            account: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        leavePlan: {
          include: {
            leaveTypeConfiguration: true,
          },
        },
      },
    });

    if (!employeePlan) {
      throw new BadRequestException(
        `Employee leave plan with ID ${employeeLeavePlanId} not found`,
      );
    }

    // Build where clause
    const whereClause: any = { employeeLeavePlanId };

    if (filters.startDate) {
      whereClause.createdAt = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(filters.endDate),
      };
    }

    // Get history
    const history = await this.prisma.leaveCreditHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        employeeLeavePlan: {
          include: {
            employee: {
              include: {
                account: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format data for Excel
    const data = history.map((entry) => ({
      Date: this.utilityService.formatDate(entry.createdAt).dateFull,
      'Transaction Type': entry.transactionType,
      Amount: this.utilityService.formatNumber(
        parseFloat(entry.amount.toString()),
        2,
      ),
      'Balance Before': this.utilityService.formatNumber(
        parseFloat(entry.balanceBefore.toString()),
        2,
      ),
      'Balance After': this.utilityService.formatNumber(
        parseFloat(entry.balanceAfter.toString()),
        2,
      ),
      Reason: entry.reason,
      'Reference ID': entry.referenceId || '',
      'Created By': entry.createdBy,
    }));

    // Create Excel buffer (you'll need to implement ExcelExportService or use a library)
    // For now, returning a placeholder buffer
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leave Credit History');

    // Add headers
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);

    // Add data
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    return await workbook.xlsx.writeBuffer();
  }

  async bulkAdjustCredits(
    leavePlanId: number,
    data: {
      adjustments: Array<{
        employeeLeavePlanId: number;
        amount: number;
        reason: string;
        transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
      }>;
    },
    currentUserAccountId: string,
  ): Promise<BulkCreditAdjustmentResponse> {
    // Get leave plan
    const leavePlan = await this.prisma.leavePlan.findUnique({
      where: { id: leavePlanId },
      include: {
        leaveTypeConfiguration: true,
      },
    });

    if (!leavePlan) {
      throw new BadRequestException(
        `Leave plan with ID ${leavePlanId} not found`,
      );
    }

    const results = [];
    let processedAdjustments = 0;
    let failedAdjustments = 0;
    let totalCreditsAdjusted = 0;

    for (const adjustment of data.adjustments) {
      try {
        // Get employee leave plan
        const employeePlan = await this.prisma.employeeLeavePlan.findUnique({
          where: {
            id: adjustment.employeeLeavePlanId,
            leavePlanId: leavePlanId,
          },
          include: {
            employee: {
              include: {
                account: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        if (!employeePlan) {
          results.push({
            employeeLeavePlanId: adjustment.employeeLeavePlanId,
            employeeName: 'Unknown',
            success: false,
            error: 'Employee leave plan not found',
          });
          failedAdjustments++;
          continue;
        }

        const currentBalance = parseFloat(
          employeePlan.currentCredits.toString(),
        );
        let newBalance: number;
        let actualAmount: number;

        switch (adjustment.transactionType) {
          case 'CREDIT':
            actualAmount = Math.abs(adjustment.amount);
            newBalance = currentBalance + actualAmount;
            break;
          case 'DEBIT':
            actualAmount = -Math.abs(adjustment.amount);
            newBalance = currentBalance + actualAmount;
            break;
          case 'ADJUSTMENT':
            actualAmount = adjustment.amount;
            newBalance = currentBalance + actualAmount;
            break;
        }

        if (newBalance < 0) {
          results.push({
            employeeLeavePlanId: adjustment.employeeLeavePlanId,
            employeeName: `${employeePlan.employee.account.firstName} ${employeePlan.employee.account.lastName}`,
            success: false,
            error: 'Insufficient credits. Balance cannot be negative.',
          });
          failedAdjustments++;
          continue;
        }

        // Update employee leave plan
        await this.prisma.employeeLeavePlan.update({
          where: { id: adjustment.employeeLeavePlanId },
          data: { currentCredits: new Decimal(newBalance) },
        });

        // Create history entry
        const historyEntry = await this.prisma.leaveCreditHistory.create({
          data: {
            employeeLeavePlanId: adjustment.employeeLeavePlanId,
            transactionType: adjustment.transactionType,
            amount: new Decimal(actualAmount),
            balanceBefore: new Decimal(currentBalance),
            balanceAfter: new Decimal(newBalance),
            reason: adjustment.reason,
            createdBy: currentUserAccountId,
          },
        });

        results.push({
          employeeLeavePlanId: adjustment.employeeLeavePlanId,
          employeeName: `${employeePlan.employee.account.firstName} ${employeePlan.employee.account.lastName}`,
          success: true,
          newBalance: this.utilityService
            .formatNumber(newBalance, 2)
            .toString(),
          historyId: historyEntry.id,
        });

        processedAdjustments++;
        totalCreditsAdjusted += Math.abs(actualAmount);
      } catch (error) {
        results.push({
          employeeLeavePlanId: adjustment.employeeLeavePlanId,
          employeeName: 'Unknown',
          success: false,
          error: error.message,
        });
        failedAdjustments++;
      }
    }

    return {
      leavePlanId,
      planName: leavePlan.planName,
      processedAdjustments,
      failedAdjustments,
      results,
      summary: {
        totalCreditsAdjusted: this.utilityService
          .formatNumber(totalCreditsAdjusted, 2)
          .toString(),
        affectedEmployees: processedAdjustments,
      },
    };
  }

  private formatCreditHistoryEntry(entry: any): LeaveCreditHistoryEntry {
    return {
      id: entry.id,
      transactionType: entry.transactionType,
      amount: this.utilityService
        .formatNumber(parseFloat(entry.amount.toString()), 2)
        .toString(),
      balanceBefore: this.utilityService
        .formatNumber(parseFloat(entry.balanceBefore.toString()), 2)
        .toString(),
      balanceAfter: this.utilityService
        .formatNumber(parseFloat(entry.balanceAfter.toString()), 2)
        .toString(),
      reason: entry.reason,
      referenceId: entry.referenceId,
      createdBy: entry.createdBy,
      createdAt: this.utilityService.formatDate(entry.createdAt),
    };
  }
}
