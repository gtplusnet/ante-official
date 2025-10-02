import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { LeaveRenewalType } from '@prisma/client';
import {
  LeavePlanResponse,
  LeavePlanListResponse,
  LeavePlanCredits,
  LeavePlanRules,
  LeavePlanRenewal,
  LeavePlanLeaveType,
  LeavePlanDates,
  LeavePlanStatistics,
} from '@shared/response/leave-plan-response.interface';

@Injectable()
export class LeavePlanService {
  constructor(
    private prisma: PrismaService,
    private utilityService: UtilityService,
  ) {}

  async createLeavePlan(data: {
    leaveTypeConfigurationId: number;
    planName: string;
    canCarryOver: boolean;
    maxCarryOverCredits?: number;
    canConvertToCash: boolean;
    maxCashConversionCredits?: number;
    canFileSameDay: boolean;
    allowLateFiling: boolean;
    advanceFilingDays?: number;
    maxConsecutiveDays?: number;
    canFileAgainstFutureCredits: boolean;
    maxAdvanceFilingDays?: number;
    isAttachmentMandatory: boolean;
    isLimitedConsecutiveFilingDays: boolean;
    consecutiveFilingDays?: number;
    renewalType: LeaveRenewalType;
    customRenewalDate?: string;
  }): Promise<LeavePlanResponse> {
    // Validate that the leave type belongs to the current company
    const leaveType = await this.prisma.leaveTypeConfiguration.findFirst({
      where: {
        id: data.leaveTypeConfigurationId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!leaveType) {
      throw new BadRequestException(
        `Leave type with ID ${data.leaveTypeConfigurationId} not found or does not belong to your company`,
      );
    }

    const createData: any = {
      leaveTypeConfigurationId: data.leaveTypeConfigurationId,
      planName: data.planName,
      canCarryOver: data.canCarryOver,
      maxCarryOverCredits: data.maxCarryOverCredits,
      canConvertToCash: data.canConvertToCash,
      maxCashConversionCredits: data.maxCashConversionCredits,
      canFileSameDay: data.canFileSameDay,
      allowLateFiling: data.allowLateFiling,
      advanceFilingDays: data.advanceFilingDays,
      maxConsecutiveDays: data.maxConsecutiveDays,
      canFileAgainstFutureCredits: data.canFileAgainstFutureCredits,
      maxAdvanceFilingDays: data.maxAdvanceFilingDays,
      isAttachmentMandatory: data.isAttachmentMandatory,
      isLimitedConsecutiveFilingDays: data.isLimitedConsecutiveFilingDays,
      consecutiveFilingDays: data.consecutiveFilingDays,
      renewalType: data.renewalType,
      customRenewalDate: data.customRenewalDate
        ? new Date(data.customRenewalDate)
        : undefined,
    };

    const createdPlan = await this.prisma.leavePlan.create({
      data: createData,
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: { isActive: true },
        },
      },
    });

    return this.formatLeavePlan(createdPlan);
  }

  async updateLeavePlan(
    id: number,
    data: Partial<{
      planName: string;
      canCarryOver: boolean;
      maxCarryOverCredits?: number;
      canConvertToCash: boolean;
      maxCashConversionCredits?: number;
      canFileSameDay: boolean;
      allowLateFiling: boolean;
      advanceFilingDays?: number;
      maxConsecutiveDays?: number;
      canFileAgainstFutureCredits: boolean;
      maxAdvanceFilingDays?: number;
      isAttachmentMandatory: boolean;
      isLimitedConsecutiveFilingDays: boolean;
      consecutiveFilingDays?: number;
      renewalType: LeaveRenewalType;
      customRenewalDate?: string;
    }>,
  ): Promise<LeavePlanResponse> {
    const updateData: any = { ...data };

    if (data.renewalType !== undefined) {
      updateData.renewalType = data.renewalType;
    }

    if (data.customRenewalDate !== undefined) {
      updateData.customRenewalDate = data.customRenewalDate
        ? new Date(data.customRenewalDate)
        : null;
    }

    const updatedPlan = await this.prisma.leavePlan.update({
      where: { id },
      data: updateData,
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: { isActive: true },
        },
      },
    });

    return this.formatLeavePlan(updatedPlan);
  }

  async archiveLeavePlan(id: number): Promise<LeavePlanResponse> {
    const archivedPlan = await this.prisma.leavePlan.update({
      where: { id },
      data: { isActive: false },
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: { isActive: true },
        },
      },
    });

    return this.formatLeavePlan(archivedPlan);
  }

  async getLeavePlanById(id: number): Promise<LeavePlanResponse> {
    id = Number(id);

    if (isNaN(id)) {
      throw new Error('Invalid leave plan ID: ' + id);
    }

    const plan = await this.prisma.leavePlan.findUnique({
      where: { id },
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: {
            isActive: true,
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
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new Error(`Leave plan with ID ${id} not found`);
    }

    return this.formatLeavePlan(plan);
  }

  async getLeavePlansByLeaveType(
    leaveTypeConfigurationId: number,
  ): Promise<LeavePlanListResponse> {
    // Validate that the leave type belongs to the current company
    const leaveType = await this.prisma.leaveTypeConfiguration.findFirst({
      where: {
        id: leaveTypeConfigurationId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!leaveType) {
      return {
        leavePlans: [],
        total: 0,
        metadata: {
          activeCount: 0,
          inactiveCount: 0,
          totalEmployees: 0,
          totalCreditsAllocated: '0',
        },
      };
    }

    const plans = await this.prisma.leavePlan.findMany({
      where: {
        leaveTypeConfigurationId,
        isActive: true,
      },
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: { isActive: true },
        },
        _count: {
          select: {
            employeeLeavePlans: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    return this.formatLeavePlanList(plans);
  }

  async getActiveLeavePlans(
    leaveTypeConfigurationId: number,
  ): Promise<LeavePlanListResponse> {
    // Validate that the leave type belongs to the current company
    const leaveType = await this.prisma.leaveTypeConfiguration.findFirst({
      where: {
        id: leaveTypeConfigurationId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!leaveType) {
      return {
        leavePlans: [],
        total: 0,
        metadata: {
          activeCount: 0,
          inactiveCount: 0,
          totalEmployees: 0,
          totalCreditsAllocated: '0',
        },
      };
    }

    const plans = await this.prisma.leavePlan.findMany({
      where: {
        leaveTypeConfigurationId,
        isActive: true,
      },
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
          where: {
            isActive: true,
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
          },
        },
      },
    });

    return this.formatLeavePlanList(plans);
  }

  async getInactiveLeavePlans(
    leaveTypeConfigurationId: number,
  ): Promise<LeavePlanListResponse> {
    // Validate that the leave type belongs to the current company
    const leaveType = await this.prisma.leaveTypeConfiguration.findFirst({
      where: {
        id: leaveTypeConfigurationId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!leaveType) {
      return {
        leavePlans: [],
        total: 0,
        metadata: {
          activeCount: 0,
          inactiveCount: 0,
          totalEmployees: 0,
          totalCreditsAllocated: '0',
        },
      };
    }

    const plans = await this.prisma.leavePlan.findMany({
      where: {
        leaveTypeConfigurationId,
        isActive: false,
      },
      include: {
        leaveTypeConfiguration: true,
        employeeLeavePlans: {
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
          },
        },
      },
    });

    return this.formatLeavePlanList(plans);
  }

  // Private formatting methods
  private formatCredits(plan: any): LeavePlanCredits {
    const totalUpfront = plan.totalUpfrontCredits
      ? this.utilityService
          .formatNumber(parseFloat(plan.totalUpfrontCredits.toString()), 2)
          .toString()
      : '0.00';
    const monthlyAccrual = plan.monthlyAccrualCredits
      ? this.utilityService
          .formatNumber(parseFloat(plan.monthlyAccrualCredits.toString()), 2)
          .toString()
      : '0.00';
    const maxCarryOver = plan.maxCarryOverCredits
      ? this.utilityService
          .formatNumber(parseFloat(plan.maxCarryOverCredits.toString()), 2)
          .toString()
      : null;
    const maxCashConversion = plan.maxCashConversionCredits
      ? this.utilityService
          .formatNumber(parseFloat(plan.maxCashConversionCredits.toString()), 2)
          .toString()
      : null;

    return {
      totalUpfront,
      monthlyAccrual,
      maxCarryOver,
      maxCashConversion,
      formatted: {
        totalUpfront: `${totalUpfront} days`,
        monthlyAccrual: `${monthlyAccrual} days/month`,
        maxCarryOver: maxCarryOver ? `${maxCarryOver} days` : null,
        maxCashConversion: maxCashConversion
          ? `${maxCashConversion} days`
          : null,
      },
    };
  }

  private formatRules(plan: any): LeavePlanRules {
    return {
      canCarryOver: plan.canCarryOver,
      canConvertToCash: plan.canConvertToCash,
      canFileSameDay: plan.canFileSameDay,
      allowLateFiling: plan.allowLateFiling,
      canFileAgainstFutureCredits: plan.canFileAgainstFutureCredits,
      isAttachmentMandatory: plan.isAttachmentMandatory,
      isLimitedConsecutiveFilingDays: plan.isLimitedConsecutiveFilingDays,
      maxConsecutiveDays: plan.maxConsecutiveDays,
      consecutiveFilingDays: plan.consecutiveFilingDays,
      advanceFilingDays: plan.advanceFilingDays,
      maxAdvanceFilingDays: plan.maxAdvanceFilingDays,
    };
  }

  private formatRenewal(plan: any): LeavePlanRenewal {
    const typeLabels = {
      HIRING_ANNIVERSARY: 'Hiring Anniversary',
      CALENDAR_YEAR: 'Calendar Year',
      FISCAL_YEAR: 'Fiscal Year',
      CUSTOM_DATE: 'Custom Date',
    };

    const customDate = plan.customRenewalDate
      ? this.utilityService.formatDate(plan.customRenewalDate)
      : null;

    return {
      type: plan.renewalType,
      typeLabel: typeLabels[plan.renewalType] || plan.renewalType,
      customDate,
    };
  }

  private formatLeaveType(leaveType: any): LeavePlanLeaveType {
    return {
      id: leaveType.id,
      name: leaveType.name,
      code: leaveType.code,
      isActive: leaveType.isActive,
    };
  }

  private formatDates(createdAt: Date, updatedAt: Date): LeavePlanDates {
    return {
      createdAt: this.utilityService.formatDate(createdAt),
      updatedAt: this.utilityService.formatDate(updatedAt),
    };
  }

  private formatStatistics(plan: any): LeavePlanStatistics {
    const employeePlans = plan.employeeLeavePlans || [];
    const totalEmployees = employeePlans.length;
    const activeEmployees = employeePlans.filter(
      (ep: any) => ep.isActive,
    ).length;

    // Calculate total credits
    const totalCreditsAllocated = employeePlans.reduce(
      (sum: number, ep: any) => {
        return (
          sum +
          (ep.currentCredits ? parseFloat(ep.currentCredits.toString()) : 0)
        );
      },
      0,
    );

    const totalCreditsUsed = employeePlans.reduce((sum: number, ep: any) => {
      return sum + (ep.usedCredits ? parseFloat(ep.usedCredits.toString()) : 0);
    }, 0);

    const totalCreditsRemaining = totalCreditsAllocated - totalCreditsUsed;

    return {
      totalEmployees,
      activeEmployees,
      totalCreditsAllocated: this.utilityService
        .formatNumber(totalCreditsAllocated, 2)
        .toString(),
      totalCreditsUsed: this.utilityService
        .formatNumber(totalCreditsUsed, 2)
        .toString(),
      totalCreditsRemaining: this.utilityService
        .formatNumber(totalCreditsRemaining, 2)
        .toString(),
    };
  }

  private formatLeavePlan(plan: any): LeavePlanResponse {
    return {
      id: plan.id,
      planName: plan.planName,
      isActive: plan.isActive,
      leaveType: this.formatLeaveType(plan.leaveTypeConfiguration),
      credits: this.formatCredits(plan),
      rules: this.formatRules(plan),
      renewal: this.formatRenewal(plan),
      dates: this.formatDates(plan.createdAt, plan.updatedAt),
      statistics: this.formatStatistics(plan),
    };
  }

  private formatLeavePlanList(plans: any[]): LeavePlanListResponse {
    const formattedPlans = plans.map((plan) => this.formatLeavePlan(plan));

    const activeCount = formattedPlans.filter((plan) => plan.isActive).length;
    const inactiveCount = formattedPlans.length - activeCount;
    const totalEmployees = formattedPlans.reduce(
      (sum, plan) => sum + plan.statistics.totalEmployees,
      0,
    );
    const totalCreditsAllocated = formattedPlans.reduce((sum, plan) => {
      return sum + parseFloat(plan.statistics.totalCreditsAllocated);
    }, 0);

    return {
      leavePlans: formattedPlans,
      total: formattedPlans.length,
      metadata: {
        activeCount,
        inactiveCount,
        totalEmployees,
        totalCreditsAllocated: totalCreditsAllocated.toFixed(2),
      },
    };
  }
}
