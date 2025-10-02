import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  EmployeeSalaryComputation,
  EmployeeSalaryComputationStage,
  CutoffDateRange,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { CutoffTypeReference } from '../../../../../../reference/cutoff.reference';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

@Injectable()
export class PayrollDataService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly employeeListService: EmployeeListService;

  async initializePayrollContext(
    timekeepingCutoffId: number,
  ): Promise<PayrollContext> {
    const context: Partial<PayrollContext> = {
      timekeepingCutoffId,
      employeeSalaryComputationPerDayBreakdown: [],
    };

    // Clear previous computation data first to avoid duplicates and stale data
    await this.clearPreviousComputationData(timekeepingCutoffId);

    // Get cutoff data
    await this.getCutoffData(context);
    // Get employee data
    await this.getEmployeeData(context);
    // Initialize salary computation database
    await this.initializeSalaryComputationDatabase(context);
    // Get employee timekeeping
    await this.getEmployeeTimekeeping(context);

    return context as PayrollContext;
  }

  private async getCutoffData(context: Partial<PayrollContext>): Promise<void> {
    context.timekeepingCutoffData =
      await this.prismaService.employeeTimekeepingCutoff.findUnique({
        where: {
          id: context.timekeepingCutoffId,
        },
        include: {
          cutoffDateRange: true,
        },
      });

    if (!context.timekeepingCutoffData) {
      throw new NotFoundException('Timekeeping cutoff not found');
    }

    context.previousTimekeepingCutoffData =
      await this.prismaService.employeeTimekeepingCutoff.findFirst({
        where: {
          cutoffDateRange: {
            endDate: {
              lt: context.timekeepingCutoffData.cutoffDateRange.startDate,
            },
          },
          accountId: context.timekeepingCutoffData.accountId,
        },
        orderBy: {
          id: 'desc',
        },
        include: {
          cutoffDateRange: true,
        },
      });

    context.previousEmployeeSalaryComputation =
      context.previousTimekeepingCutoffData
        ? await this.prismaService.employeeSalaryComputation.findFirst({
            where: {
              employeeTimekeepingCutoffId:
                context.previousTimekeepingCutoffData.id,
            },
          })
        : null;

    if (
      !context.previousEmployeeSalaryComputation &&
      context.previousTimekeepingCutoffData
    ) {
      context.previousEmployeeSalaryComputation =
        await this.prismaService.employeeSalaryComputation.create({
          data: {
            employeeTimekeepingCutoffId:
              context.previousTimekeepingCutoffData.id,
          },
        });
    }

    const cutoffDateRange: CutoffDateRange =
      await this.prismaService.cutoffDateRange.findUnique({
        where: {
          id: context.timekeepingCutoffData.cutoffDateRangeId,
        },
      });

    context.cutoff = await this.prismaService.cutoff.findUnique({
      where: {
        id: cutoffDateRange.cutoffId,
      },
    });

    context.cutoffType = CutoffTypeReference.find(
      (cutoff) => cutoff.key == context.cutoff.cutoffType,
    );
    context.dateBasis = this.utilityService.formatDate(
      cutoffDateRange.startDate,
    );
  }

  private async initializeSalaryComputationDatabase(
    context: Partial<PayrollContext>,
  ): Promise<void> {
    const commonData = {
      stage: EmployeeSalaryComputationStage.COMPUTED,
      salaryRateType: context.employeeData.payrollGroup.salaryRateType.key,
      deductionPeriodWitholdingTax:
        context.employeeData.payrollGroup.deductionPeriodWitholdingTax.key,
      deductionPeriodSSS:
        context.employeeData.payrollGroup.deductionPeriodSSS.key,
      deductionPeriodPhilhealth:
        context.employeeData.payrollGroup.deductionPeriodPhilhealth.key,
      deductionPeriodPagibig:
        context.employeeData.payrollGroup.deductionPeriodPagibig.key,
      deductionBasisSSS:
        context.employeeData.payrollGroup.deductionBasisSSS.key,
      deductionBasisPhilhealth:
        context.employeeData.payrollGroup.deductionBasisPhilhealth.key,
    };

    context.employeeSalaryComputation =
      await this.prismaService.employeeSalaryComputation.upsert({
        where: {
          employeeTimekeepingCutoffId: context.timekeepingCutoffId,
        },
        create: {
          employeeTimekeepingCutoffId: context.timekeepingCutoffId,
          ...commonData,
        },
        update: {
          ...commonData,
        },
      });
  }

  private async getEmployeeData(
    context: Partial<PayrollContext>,
  ): Promise<void> {
    context.employeeData = await this.employeeListService.info(
      context.timekeepingCutoffData.accountId,
    );
  }

  private async getEmployeeTimekeeping(
    context: Partial<PayrollContext>,
  ): Promise<void> {
    context.employeeTimekeeping =
      await this.prismaService.employeeTimekeeping.findMany({
        where: {
          employeeTimekeepingCutoff: {
            accountId: context.timekeepingCutoffData.accountId,
          },
          employeeTimekeepingCutoffId: context.timekeepingCutoffId,
        },
      });
  }

  async updateEmployeeSalaryComputation(
    timekeepingCutoffId: number,
    data: Partial<EmployeeSalaryComputation>,
  ): Promise<EmployeeSalaryComputation> {
    return await this.prismaService.employeeSalaryComputation.update({
      where: {
        employeeTimekeepingCutoffId: timekeepingCutoffId,
      },
      data,
    });
  }

  async clearPreviousComputationData(
    timekeepingCutoffId: number,
  ): Promise<void> {
    // Clear previous computation data to avoid duplicates and stale data during recomputation
    const existingComputation =
      await this.prismaService.employeeSalaryComputation.findUnique({
        where: {
          employeeTimekeepingCutoffId: timekeepingCutoffId,
        },
      });

    if (!existingComputation) {
      return;
    }

    await Promise.all([
      // Clear daily computation breakdowns
      this.prismaService.employeeSalaryComputationPerDay.deleteMany({
        where: {
          timekeeping: {
            employeeTimekeepingCutoffId: timekeepingCutoffId,
          },
        },
      }),

      // Clear deduction records
      this.prismaService.employeeSalaryComputationDeductions.deleteMany({
        where: {
          employeeSalaryComputationId: timekeepingCutoffId,
        },
      }),

      // Clear allowance records
      this.prismaService.employeeSalaryComputationAllowances.deleteMany({
        where: {
          employeeSalaryComputationId: timekeepingCutoffId,
        },
      }),

      // Clear government payment history records
      this.prismaService.governmentPaymentHistory.deleteMany({
        where: {
          employeeTimekeepingCutoffId: timekeepingCutoffId,
        },
      }),

      // Reset all numeric fields in EmployeeSalaryComputation to ensure clean recomputation
      this.prismaService.employeeSalaryComputation.update({
        where: {
          employeeTimekeepingCutoffId: timekeepingCutoffId,
        },
        data: {
          // Basic earnings and deductions
          basicSalary: 0,
          deductionLate: 0,
          deductionUndertime: 0,
          deductionAbsent: 0,
          deductionSalaryAdjustmnt: 0,
          allowance: 0,
          earningsPlusAllowance: 0,

          // Government contributions
          governmentContributionSSS: 0,
          governmentContributionPhilhealth: 0,
          governmentContributionPagibig: 0,
          governmentContributionTax: 0,
          totalGovernmentContribution: 0,

          // Loans and pay calculations
          loans: 0,
          basicPay: 0,
          grossPay: 0,
          netPay: 0,

          // Additional earnings
          earningNightDifferential: 0,
          earningOvertime: 0,
          earningRegularHoliday: 0,
          earningRestDay: 0,
          earningSalaryAdjustment: 0,
          earningSpecialHoliday: 0,
          totalAdditionalEarnings: 0,
          totalDeduction: 0,
          earningNightDifferentialOvertime: 0,

          // Rate calculations
          cutoffRate: 0,
          dailyRate: 0,
          hourlyRate: 0,
          monthlyRate: 0,
          basicPayMonthlyRate: 0,
          totalAdditionalDeduction: 0,

          // SSS detailed contributions
          governmentContributionSSSEEMPF: 0,
          governmentContributionSSSEER: 0,
          governmentContributionSSSEETotal: 0,
          governmentContributionSSSERMPF: 0,
          governmentContributionSSSERR: 0,
          governmentContributionSSSERTotal: 0,
          governmentContributionSSSMSMPF: 0,
          governmentContributionSSSMSR: 0,
          governmentContributionSSSMSTotal: 0,
          governmentContributionSSSBasis: 0,
          governmentContributionSSSEREC: 0,

          // Philhealth detailed
          governmentContributionPhilhealthBasis: 0,
          governmentContributionPhilhealthMaximum: 0,
          governmentContributionPhilhealthMinimum: 0,
          governmentContributionPhilhealthPercentage: 0,
          governmentContributionPhilhealthEmployeeShare: 0,
          governmentContributionPhilhealthEmployerShare: 0,

          // Pagibig detailed
          governmentContributionPagibigBasis: 0,
          governmentContributionPagibigEmployeeShare: 0,
          governmentContributionPagibigEmployerShare: 0,
          governmentContributionPagibigMaximumEEShare: 0,
          governmentContributionPagibigMaximumERShare: 0,
          governmentContributionPagibigMinimumPercentage: 0,
          governmentContributionPagibigMinimumShare: 0,
          governmentContributionPagibigPercentage: 0,

          // Tax calculations
          grossTaxableIncome: 0,
          nonTaxableAllowance: 0,
          taxableAllowance: 0,
          deminimisAllowance: 0,
          totalBasicSalary: 0,
          totalNonTaxableGovernmentContribution: 0,
          taxFixedAmount: 0,
          taxOffset: 0,
          taxPercentage: 0,
          taxTotal: 0,
          nonTaxableDeduction: 0,
          taxableIncome: 0,
          taxByPercentage: 0,

          // Previous period values
          governmentContributionPagibigBasicCurrent: 0,
          governmentContributionPagibigBasisPrevious: 0,
          governmentContributionPhilhealthBasicCurrent: 0,
          governmentContributionPhilhealthBasisPrevious: 0,
          governmentContributionSSSBasicCurrent: 0,
          taxableIncomeCurrent: 0,
          taxableIncomePrevious: 0,
          governmentContributionSSSBasisPrevious: 0,
        },
      }),
    ]);
  }
}
