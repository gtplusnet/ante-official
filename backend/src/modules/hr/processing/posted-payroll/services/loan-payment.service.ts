import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { Prisma, DeductionCategory } from '@prisma/client';

@Injectable()
export class LoanPaymentService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async processLoanPayments(
    employeeTimekeepingCutoffId: number,
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    // Get all loan-type deductions (not yet posted)
    const loanDeductions =
      await prisma.employeeSalaryComputationDeductions.findMany({
        where: {
          employeeSalaryComputationId: employeeTimekeepingCutoffId,
          isPosted: false,
          deductionPlan: {
            deductionConfiguration: {
              category: DeductionCategory.LOAN,
            },
          },
        },
        include: {
          deductionPlan: {
            include: {
              deductionConfiguration: true,
            },
          },
        },
      });

    // Process each loan payment
    for (const loanDeduction of loanDeductions) {
      await this.updateLoanBalance(loanDeduction, cutoffDateRangeId, prisma);
    }
  }

  private async updateLoanBalance(
    loanDeduction: any,
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    const { deductionPlan, amount } = loanDeduction;

    // For loans, we need to check if the payment exceeds the remaining balance
    const currentBalance = deductionPlan.remainingBalance;
    const paymentAmount = Math.min(amount, currentBalance);

    if (paymentAmount <= 0) {
      // No payment needed if balance is 0 or negative
      return;
    }

    // The deduction history is already created by DeductionHistoryService
    // Here we just need to handle special loan logic if needed

    // Check if loan is fully paid
    const newBalance = currentBalance - paymentAmount;
    if (newBalance <= 0) {
      // Mark loan as closed
      await prisma.deductionPlan.update({
        where: { id: deductionPlan.id },
        data: {
          isOpen: false,
          remainingBalance: 0,
        },
      });
    }
  }
}
