import { Injectable, Inject } from '@nestjs/common';
import {
  DeductionPeriod,
  SalaryAdjustmentType,
  AllowanceType,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

@Injectable()
export class AllowancesService {
  @Inject() private readonly prismaService: PrismaService;

  async computeAllowances(context: PayrollContext): Promise<void> {
    const cutoffStartDate =
      context.timekeepingCutoffData.cutoffDateRange.startDate;

    // Create end-of-day date for cutoff start to ensure timezone-independent comparison
    // This ensures that any effectivity date on the same calendar day as cutoff start is included
    const cutoffStartEndOfDay = new Date(
      cutoffStartDate.getFullYear(),
      cutoffStartDate.getMonth(),
      cutoffStartDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const allowances = await this.prismaService.allowancePlan.findMany({
      where: {
        accountId: context.employeeData.accountDetails.id,
        isActive: true,
        effectivityDate: {
          lte: cutoffStartEndOfDay,
        },
        allowanceConfiguration: {
          isDeleted: false,
        },
      },
      include: {
        allowanceConfiguration: true,
      },
    });

    for (const allowance of allowances) {
      await this.processAllowancePlan(allowance, context);
    }

    // Process adjusted allowances
    await this.processAdjustedAllowances(context);
  }

  private async processAllowancePlan(
    allowance: any,
    context: PayrollContext,
  ): Promise<void> {
    let amount = 0;
    const deductionPeriod: DeductionPeriod = allowance.deductionPeriod;

    if (deductionPeriod === DeductionPeriod.EVERY_PERIOD) {
      amount = allowance.amount / context.cutoffType.divisor;
    } else if (
      deductionPeriod === DeductionPeriod.FIRST_PERIOD ||
      deductionPeriod === DeductionPeriod.LAST_PERIOD
    ) {
      const cutoffDateRange =
        await this.prismaService.cutoffDateRange.findUnique({
          where: {
            id: context.timekeepingCutoffData.cutoffDateRangeId,
          },
        });

      if (deductionPeriod == cutoffDateRange.cutoffPeriodType) {
        amount = allowance.amount;
      } else {
        amount = 0;
      }
    } else {
      amount = 0;
    }

    if (amount > 0) {
      // Add to total allowance
      context.employeeSalaryComputation.allowance += amount;

      // Categorize allowance based on type
      const category = allowance.allowanceConfiguration
        .category as AllowanceType;
      switch (category) {
        case AllowanceType.TAXABLE:
          context.employeeSalaryComputation.taxableAllowance += amount;
          break;
        case AllowanceType.NON_TAXABLE:
          context.employeeSalaryComputation.nonTaxableAllowance += amount;
          break;
        case AllowanceType.DEMINIMIS:
          context.employeeSalaryComputation.deminimisAllowance += amount;
          break;
      }

      await this.prismaService.employeeSalaryComputationAllowances.upsert({
        where: {
          employeeSalaryComputationId_allowancePlanId: {
            employeeSalaryComputationId:
              context.employeeSalaryComputation.employeeTimekeepingCutoffId,
            allowancePlanId: allowance.id,
          },
        },
        create: {
          employeeSalaryComputationId:
            context.employeeSalaryComputation.employeeTimekeepingCutoffId,
          allowancePlanId: allowance.id,
          amount: amount,
        },
        update: {
          amount: amount,
        },
      });
    }
  }

  private async processAdjustedAllowances(
    context: PayrollContext,
  ): Promise<void> {
    // Fetch adjusted allowances for this employee and cutoff
    const adjustedAllowances =
      await this.prismaService.employeeSalaryAdjustment.findMany({
        where: {
          accountId: context.employeeData.accountDetails.id,
          cutoffDateRangeId: context.timekeepingCutoffData.cutoffDateRangeId,
          adjustmentType: SalaryAdjustmentType.ALLOWANCE,
          isActive: true,
        },
      });

    // Add adjusted allowances to the total and categorize them
    for (const adjustment of adjustedAllowances) {
      const amount = Number(adjustment.amount);
      context.employeeSalaryComputation.allowance += amount;

      // Get the allowance configuration to determine category
      const allowanceConfig =
        await this.prismaService.allowanceConfiguration.findUnique({
          where: { id: adjustment.configurationId },
        });

      // Categorize adjusted allowance based on configuration category
      if (allowanceConfig) {
        const category = allowanceConfig.category as AllowanceType;
        switch (category) {
          case AllowanceType.TAXABLE:
            context.employeeSalaryComputation.taxableAllowance += amount;
            break;
          case AllowanceType.NON_TAXABLE:
            context.employeeSalaryComputation.nonTaxableAllowance += amount;
            break;
          case AllowanceType.DEMINIMIS:
            context.employeeSalaryComputation.deminimisAllowance += amount;
            break;
        }
      }
    }
  }
}
