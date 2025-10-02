import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  EmployeeSalaryComputation,
  GovernmentPaymentHistory,
  GovernmentPaymentType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class GovernmentPaymentService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async recordGovernmentPayments(
    salaryComputation: EmployeeSalaryComputation,
    accountId: string,
    cutoffDateRangeId: string,
    prisma: Prisma.TransactionClient,
  ): Promise<GovernmentPaymentHistory[]> {
    const governmentPayments: GovernmentPaymentHistory[] = [];

    // SSS Payment
    if (salaryComputation.governmentContributionSSS > 0) {
      const sssPayment = await this.createGovernmentPayment(
        {
          type: GovernmentPaymentType.SSS,
          amount: salaryComputation.governmentContributionSSS,
          employeeShare: salaryComputation.governmentContributionSSSEETotal,
          employerShare: salaryComputation.governmentContributionSSSERTotal,
          basis: salaryComputation.governmentContributionSSSBasis,
          // SSS Breakdown
          employeeShareRegular: salaryComputation.governmentContributionSSSEER,
          employeeShareMPF: salaryComputation.governmentContributionSSSEEMPF,
          employerShareRegular: salaryComputation.governmentContributionSSSERR,
          employerShareMPF: salaryComputation.governmentContributionSSSERMPF,
          employerShareEC: salaryComputation.governmentContributionSSSEREC,
          cutoffDateRangeId,
          employeeTimekeepingCutoffId:
            salaryComputation.employeeTimekeepingCutoffId,
          accountId,
        },
        prisma,
      );
      governmentPayments.push(sssPayment);
    }

    // PhilHealth Payment
    if (salaryComputation.governmentContributionPhilhealth > 0) {
      const philhealthPayment = await this.createGovernmentPayment(
        {
          type: GovernmentPaymentType.PHILHEALTH,
          amount: salaryComputation.governmentContributionPhilhealth,
          employeeShare:
            salaryComputation.governmentContributionPhilhealthEmployeeShare,
          employerShare:
            salaryComputation.governmentContributionPhilhealthEmployerShare,
          basis: salaryComputation.governmentContributionPhilhealthBasis,
          cutoffDateRangeId,
          employeeTimekeepingCutoffId:
            salaryComputation.employeeTimekeepingCutoffId,
          accountId,
        },
        prisma,
      );
      governmentPayments.push(philhealthPayment);
    }

    // Pag-IBIG Payment
    if (salaryComputation.governmentContributionPagibig > 0) {
      const pagibigPayment = await this.createGovernmentPayment(
        {
          type: GovernmentPaymentType.PAGIBIG,
          amount: salaryComputation.governmentContributionPagibig,
          employeeShare:
            salaryComputation.governmentContributionPagibigEmployeeShare,
          employerShare:
            salaryComputation.governmentContributionPagibigEmployerShare,
          basis: salaryComputation.governmentContributionPagibigBasis,
          cutoffDateRangeId,
          employeeTimekeepingCutoffId:
            salaryComputation.employeeTimekeepingCutoffId,
          accountId,
        },
        prisma,
      );
      governmentPayments.push(pagibigPayment);
    }

    // Withholding Tax Payment
    if (salaryComputation.governmentContributionTax > 0) {
      const taxPayment = await this.createGovernmentPayment(
        {
          type: GovernmentPaymentType.WITHHOLDING_TAX,
          amount: salaryComputation.governmentContributionTax,
          employeeShare: salaryComputation.governmentContributionTax,
          employerShare: 0, // Tax is only employee share
          basis: salaryComputation.taxableIncome,
          cutoffDateRangeId,
          employeeTimekeepingCutoffId:
            salaryComputation.employeeTimekeepingCutoffId,
          accountId,
        },
        prisma,
      );
      governmentPayments.push(taxPayment);
    }

    return governmentPayments;
  }

  private async createGovernmentPayment(
    data: {
      type: GovernmentPaymentType;
      amount: number;
      employeeShare: number;
      employerShare: number;
      basis: number;
      // SSS Breakdown fields (optional for non-SSS types)
      employeeShareRegular?: number;
      employeeShareMPF?: number;
      employerShareRegular?: number;
      employerShareMPF?: number;
      employerShareEC?: number;
      cutoffDateRangeId: string;
      employeeTimekeepingCutoffId: number;
      accountId: string;
    },
    prisma: Prisma.TransactionClient,
  ): Promise<GovernmentPaymentHistory> {
    return await prisma.governmentPaymentHistory.create({
      data: {
        type: data.type,
        amount: data.amount,
        employeeShare: data.employeeShare,
        employerShare: data.employerShare,
        basis: data.basis,
        // Include SSS breakdown fields if provided
        ...(data.employeeShareRegular !== undefined && {
          employeeShareRegular: data.employeeShareRegular,
        }),
        ...(data.employeeShareMPF !== undefined && {
          employeeShareMPF: data.employeeShareMPF,
        }),
        ...(data.employerShareRegular !== undefined && {
          employerShareRegular: data.employerShareRegular,
        }),
        ...(data.employerShareMPF !== undefined && {
          employerShareMPF: data.employerShareMPF,
        }),
        ...(data.employerShareEC !== undefined && {
          employerShareEC: data.employerShareEC,
        }),
        cutoffDateRangeId: data.cutoffDateRangeId,
        employeeTimekeepingCutoffId: data.employeeTimekeepingCutoffId,
        accountId: data.accountId,
        isPosted: true,
      },
    });
  }
}
