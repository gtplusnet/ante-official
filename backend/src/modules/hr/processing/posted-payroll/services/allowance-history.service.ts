import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  EmployeeSalaryComputationAllowances,
  AllowancePlanHistory,
  Prisma,
  FundTransactionCode,
} from '@prisma/client';

@Injectable()
export class AllowanceHistoryService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async processAllowances(
    employeeTimekeepingCutoffId: number,
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<void> {
    // Get all allowances for this employee's salary computation
    const allowances =
      await prisma.employeeSalaryComputationAllowances.findMany({
        where: {
          employeeSalaryComputationId: employeeTimekeepingCutoffId,
          isPosted: false,
        },
        include: {
          allowancePlan: {
            include: {
              allowanceConfiguration: true,
            },
          },
        },
      });

    // Process each allowance
    for (const allowance of allowances) {
      await this.createAllowanceHistory(allowance, cutoffDateRangeId, prisma);
    }
  }

  private async createAllowanceHistory(
    allowance: EmployeeSalaryComputationAllowances & {
      allowancePlan: any;
    },
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<AllowancePlanHistory> {
    const { allowancePlan } = allowance;

    // Get the last history record to determine the before balance
    const lastHistory = await prisma.allowancePlanHistory.findFirst({
      where: { allowancePlanId: allowancePlan.id },
      orderBy: { createdAt: 'desc' },
    });

    const beforeBalance = lastHistory ? lastHistory.afterBalance : 0;
    const afterBalance = beforeBalance + allowance.amount;

    // Create history record
    const history = await prisma.allowancePlanHistory.create({
      data: {
        allowancePlanId: allowancePlan.id,
        amount: allowance.amount,
        beforeBalance,
        afterBalance,
        transactionCode: FundTransactionCode.BEGINNING_BALANCE, // You might want to add a specific code for allowance payments
        remarks: `Payroll allowance for cutoff ${cutoffDateRangeId}`,
        cutoffDateRangeId, // Add the cutoff reference
      },
    });

    return history;
  }
}
