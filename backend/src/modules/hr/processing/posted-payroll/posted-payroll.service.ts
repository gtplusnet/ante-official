import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { PostingResult, PostingError } from './posted-payroll.interface';
import {
  CutoffDateRange,
  EmployeeTimekeepingCutoff,
  EmployeeSalaryComputation,
  Prisma,
  CutoffDateRangeStatus,
} from '@prisma/client';
import { AllowanceHistoryService } from './services/allowance-history.service';
import { DeductionHistoryService } from './services/deduction-history.service';
import { LoanPaymentService } from './services/loan-payment.service';
import { GovernmentPaymentService } from './services/government-payment.service';

@Injectable()
export class PostedPayrollService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly allowanceHistoryService: AllowanceHistoryService;
  @Inject() private readonly deductionHistoryService: DeductionHistoryService;
  @Inject() private readonly loanPaymentService: LoanPaymentService;
  @Inject() private readonly governmentPaymentService: GovernmentPaymentService;

  async processCutoffPosting(
    cutoffDateRangeId: string,
    isReposting = false,
  ): Promise<PostingResult> {
    const errors: PostingError[] = [];
    let processedCount = 0;

    // Validate cutoff exists and is in APPROVED status
    await this.validateCutoffForPosting(cutoffDateRangeId, isReposting);

    // If reposting, clear existing posted data first
    if (isReposting) {
      await this.clearPostedData(cutoffDateRangeId);
    }

    // Get all employee timekeeping cutoffs for this cutoff date range
    const employeeTimekeepingCutoffs =
      await this.prismaService.employeeTimekeepingCutoff.findMany({
        where: { cutoffDateRangeId },
        include: {
          account: true,
          EmployeeSalaryComputation: true,
        },
      });

    // Process each employee in a transaction
    for (const employeeTimekeepingCutoff of employeeTimekeepingCutoffs) {
      try {
        await this.prismaService.$transaction(async (prisma) => {
          await this.processEmployeePosting(
            employeeTimekeepingCutoff,
            cutoffDateRangeId,
            prisma,
          );
        });
        processedCount++;
      } catch (error) {
        errors.push({
          employeeTimekeepingCutoffId: employeeTimekeepingCutoff.id,
          accountId: employeeTimekeepingCutoff.accountId,
          error: error.message,
          type: 'deduction', // Default type, could be enhanced
        });
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors,
    };
  }

  private async validateCutoffForPosting(
    cutoffDateRangeId: string,
    isReposting = false,
  ): Promise<CutoffDateRange> {
    const cutoffDateRange = await this.prismaService.cutoffDateRange.findUnique(
      {
        where: { id: cutoffDateRangeId },
      },
    );

    if (!cutoffDateRange) {
      throw new BadRequestException('Cutoff date range not found');
    }

    if (cutoffDateRange.status !== CutoffDateRangeStatus.APPROVED) {
      throw new BadRequestException(
        'Cutoff must be in APPROVED status before posting',
      );
    }

    // Check if already posted (only if not reposting)
    if (!isReposting) {
      const hasPostedRecords =
        await this.prismaService.governmentPaymentHistory.count({
          where: { cutoffDateRangeId },
        });

      if (hasPostedRecords > 0) {
        throw new BadRequestException('This cutoff has already been posted');
      }
    }

    return cutoffDateRange;
  }

  private async clearPostedData(cutoffDateRangeId: string): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      // 1. Get all employee timekeeping cutoffs for this cutoff date range
      const employeeTimekeepingCutoffs =
        await prisma.employeeTimekeepingCutoff.findMany({
          where: { cutoffDateRangeId },
          include: {
            EmployeeSalaryComputation: {
              include: {
                EmployeeSalaryComputationDeductions: {
                  include: {
                    deductionPlan: true,
                  },
                },
                EmployeeSalaryComputationAllowances: true,
              },
            },
          },
        });

      // 2. Collect all deduction plan IDs that were affected and their previous states
      const deductionPlanUpdates = new Map();

      for (const cutoff of employeeTimekeepingCutoffs) {
        if (cutoff.EmployeeSalaryComputation) {
          for (const deduction of cutoff.EmployeeSalaryComputation
            .EmployeeSalaryComputationDeductions) {
            if (deduction.isPosted) {
              const planId = deduction.deductionPlan.id;
              if (!deductionPlanUpdates.has(planId)) {
                // Get the history to calculate previous balances
                const historyRecords =
                  await prisma.deductionPlanHistory.findMany({
                    where: {
                      deductionPlanId: planId,
                      cutoffDateRangeId: cutoffDateRangeId,
                    },
                  });

                if (historyRecords.length > 0) {
                  const totalDeductedAmount = historyRecords.reduce(
                    (sum, record) => sum + Math.abs(record.amount),
                    0,
                  );
                  deductionPlanUpdates.set(planId, {
                    totalPaidAmountToSubtract: totalDeductedAmount,
                    shouldReopen: !deduction.deductionPlan.isOpen, // Reopen if it was closed
                  });
                }
              }
            }
          }
        }
      }

      // 3. Delete government payment history
      await prisma.governmentPaymentHistory.deleteMany({
        where: { cutoffDateRangeId },
      });

      // 4. Delete allowance plan history
      await prisma.allowancePlanHistory.deleteMany({
        where: { cutoffDateRangeId },
      });

      // 5. Delete deduction plan history
      await prisma.deductionPlanHistory.deleteMany({
        where: { cutoffDateRangeId },
      });

      // 6. Restore deduction plan balances
      for (const [planId, updates] of deductionPlanUpdates.entries()) {
        const currentPlan = await prisma.deductionPlan.findUnique({
          where: { id: planId },
        });

        if (currentPlan) {
          const restoredTotalPaidAmount = Math.max(
            0,
            currentPlan.totalPaidAmount - updates.totalPaidAmountToSubtract,
          );
          const restoredRemainingBalance =
            currentPlan.remainingBalance + updates.totalPaidAmountToSubtract;

          await prisma.deductionPlan.update({
            where: { id: planId },
            data: {
              totalPaidAmount: restoredTotalPaidAmount,
              remainingBalance: restoredRemainingBalance,
              isOpen: updates.shouldReopen || currentPlan.isOpen,
            },
          });
        }
      }

      // 7. Reset isPosted flags for deductions
      await prisma.employeeSalaryComputationDeductions.updateMany({
        where: {
          employeeSalaryComputationId: {
            in: employeeTimekeepingCutoffs.map((c) => c.id),
          },
          isPosted: true,
        },
        data: { isPosted: false },
      });

      // 8. Reset isPosted flags for allowances
      await prisma.employeeSalaryComputationAllowances.updateMany({
        where: {
          employeeSalaryComputationId: {
            in: employeeTimekeepingCutoffs.map((c) => c.id),
          },
          isPosted: true,
        },
        data: { isPosted: false },
      });
    });
  }

  private async processEmployeePosting(
    employeeTimekeepingCutoff: EmployeeTimekeepingCutoff & {
      account: unknown;
      EmployeeSalaryComputation: EmployeeSalaryComputation | null;
    },
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    if (!employeeTimekeepingCutoff.EmployeeSalaryComputation) {
      throw new Error(
        `No salary computation found for employee ${employeeTimekeepingCutoff.accountId}`,
      );
    }

    const salaryComputation =
      employeeTimekeepingCutoff.EmployeeSalaryComputation;

    // 1. Process and record deductions
    await this.deductionHistoryService.processDeductions(
      employeeTimekeepingCutoff.id,
      cutoffDateRangeId,
      prisma,
    );

    // 2. Process loan payments (update balances)
    await this.loanPaymentService.processLoanPayments(
      employeeTimekeepingCutoff.id,
      cutoffDateRangeId,
      prisma,
    );

    // 3. Process and record allowances
    await this.allowanceHistoryService.processAllowances(
      employeeTimekeepingCutoff.id,
      cutoffDateRangeId,
      prisma,
    );

    // 4. Record government payment history
    await this.governmentPaymentService.recordGovernmentPayments(
      salaryComputation,
      employeeTimekeepingCutoff.accountId,
      cutoffDateRangeId,
      prisma,
    );

    // 5. Mark all computation records as posted
    await this.markComputationAsPosted(employeeTimekeepingCutoff.id, prisma);
  }

  private async markComputationAsPosted(
    employeeTimekeepingCutoffId: number,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    // Mark deductions as posted
    await prisma.employeeSalaryComputationDeductions.updateMany({
      where: { employeeSalaryComputationId: employeeTimekeepingCutoffId },
      data: { isPosted: true },
    });

    // Mark allowances as posted
    await prisma.employeeSalaryComputationAllowances.updateMany({
      where: { employeeSalaryComputationId: employeeTimekeepingCutoffId },
      data: { isPosted: true },
    });
  }
}
