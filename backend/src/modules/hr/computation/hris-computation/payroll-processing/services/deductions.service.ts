import { Injectable, Inject } from '@nestjs/common';
import { DeductionPeriod, SalaryAdjustmentType } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

@Injectable()
export class DeductionsService {
  @Inject() private readonly prismaService: PrismaService;

  async computeLoansAndDeductions(context: PayrollContext): Promise<void> {
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

    const loans = await this.prismaService.deductionPlan.findMany({
      where: {
        accountId: context.employeeData.accountDetails.id,
        isActive: true,
        effectivityDate: {
          lte: cutoffStartEndOfDay,
        },
        deductionConfiguration: {
          isDeleted: false,
        },
      },
      include: {
        deductionConfiguration: true,
      },
    });

    for (const loan of loans) {
      await this.processDeductionPlan(loan, context);
    }

    // Process adjusted deductions
    await this.processAdjustedDeductions(context);
  }

  private async processDeductionPlan(
    loan: any,
    context: PayrollContext,
  ): Promise<void> {
    let amount = 0;
    const deductionPeriod: DeductionPeriod = loan.deductionPeriod;

    if (deductionPeriod === DeductionPeriod.EVERY_PERIOD) {
      amount = loan.monthlyAmortization / context.cutoffType.divisor;
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
        amount = loan.monthlyAmortization;
      } else {
        amount = 0;
      }
    } else {
      amount = 0;
    }

    if (amount > 0) {
      context.employeeSalaryComputation.loans += amount;

      await this.prismaService.employeeSalaryComputationDeductions.upsert({
        where: {
          employeeSalaryComputationId_deductionPlanId: {
            employeeSalaryComputationId:
              context.employeeSalaryComputation.employeeTimekeepingCutoffId,
            deductionPlanId: loan.id,
          },
        },
        create: {
          employeeSalaryComputationId:
            context.employeeSalaryComputation.employeeTimekeepingCutoffId,
          deductionPlanId: loan.id,
          amount: amount,
        },
        update: {
          amount: amount,
        },
      });
    }
  }

  private async processAdjustedDeductions(
    context: PayrollContext,
  ): Promise<void> {
    // Fetch adjusted deductions for this employee and cutoff
    const adjustedDeductions =
      await this.prismaService.employeeSalaryAdjustment.findMany({
        where: {
          accountId: context.employeeData.accountDetails.id,
          cutoffDateRangeId: context.timekeepingCutoffData.cutoffDateRangeId,
          adjustmentType: SalaryAdjustmentType.DEDUCTION,
          isActive: true,
        },
      });

    // Add adjusted deductions to the total
    for (const adjustment of adjustedDeductions) {
      context.employeeSalaryComputation.loans += Number(adjustment.amount);
    }
  }
}
