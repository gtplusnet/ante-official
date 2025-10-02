import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  EmployeeSalaryComputationDeductions,
  DeductionPlanHistory,
  Prisma,
  FundTransactionCode,
} from '@prisma/client';

@Injectable()
export class DeductionHistoryService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async processDeductions(
    employeeTimekeepingCutoffId: number,
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    // Get all deductions for this employee's salary computation
    const deductions =
      await prisma.employeeSalaryComputationDeductions.findMany({
        where: {
          employeeSalaryComputationId: employeeTimekeepingCutoffId,
          isPosted: false,
        },
        include: {
          deductionPlan: {
            include: {
              deductionConfiguration: true,
            },
          },
        },
      });

    // Process each deduction
    for (const deduction of deductions) {
      await this.createDeductionHistory(deduction, cutoffDateRangeId, prisma);
    }
  }

  private async createDeductionHistory(
    deduction: EmployeeSalaryComputationDeductions & {
      deductionPlan: any;
    },
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<DeductionPlanHistory> {
    const { deductionPlan } = deduction;

    // Get the last history record to determine the before balance
    const lastHistory = await prisma.deductionPlanHistory.findFirst({
      where: { deductionPlanId: deductionPlan.id },
      orderBy: { createdAt: 'desc' },
    });

    const beforeBalance = lastHistory ? lastHistory.afterBalance : 0;
    const afterBalance = beforeBalance - deduction.amount;

    // Create history record
    const history = await prisma.deductionPlanHistory.create({
      data: {
        deductionPlanId: deductionPlan.id,
        amount: -deduction.amount, // Negative because it's a deduction
        beforeBalance,
        afterBalance,
        transactionCode: FundTransactionCode.SUBTRACT_LOAN_BALANCE,
        remarks: `Payroll deduction for cutoff ${cutoffDateRangeId}`,
        cutoffDateRangeId, // Add the cutoff reference
      },
    });

    // Update total paid amount on the deduction plan
    const totalPaidAmount = deductionPlan.totalPaidAmount + deduction.amount;
    await prisma.deductionPlan.update({
      where: { id: deductionPlan.id },
      data: {
        totalPaidAmount,
        remainingBalance: afterBalance,
      },
    });

    return history;
  }
}
