import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

@Injectable()
export class PayrollAggregationService {
  @Inject() private readonly prismaService: PrismaService;

  async updateTotalCutoffDateRangeInformation(
    context: PayrollContext,
  ): Promise<void> {
    // Sum all relevant fields of all employees in the cutoff date range
    const totalSalaryComputation =
      await this.prismaService.employeeSalaryComputation.aggregate({
        where: {
          employeeTimekeepingCutoff: {
            cutoffDateRangeId: context.timekeepingCutoffData.cutoffDateRangeId,
          },
        },
        _sum: {
          monthlyRate: true,
          cutoffRate: true,
          dailyRate: true,
          hourlyRate: true,
          basicSalary: true,
          totalBasicSalary: true,
          deductionLate: true,
          deductionUndertime: true,
          deductionAbsent: true,
          deductionSalaryAdjustmnt: true,
          totalAdditionalDeduction: true,
          earningRestDay: true,
          earningOvertime: true,
          earningNightDifferential: true,
          earningNightDifferentialOvertime: true,
          earningSpecialHoliday: true,
          earningRegularHoliday: true,
          earningSalaryAdjustment: true,
          totalAdditionalEarnings: true,
          allowance: true,
          taxableAllowance: true,
          nonTaxableAllowance: true,
          deminimisAllowance: true,
          earningsPlusAllowance: true,
          governmentContributionSSS: true,
          governmentContributionSSSBasis: true,
          governmentContributionSSSEER: true,
          governmentContributionSSSEREC: true,
          governmentContributionSSSEEMPF: true,
          governmentContributionSSSEETotal: true,
          governmentContributionSSSERR: true,
          governmentContributionSSSERMPF: true,
          governmentContributionSSSERTotal: true,
          governmentContributionSSSMSR: true,
          governmentContributionSSSMSMPF: true,
          governmentContributionSSSMSTotal: true,
          governmentContributionPhilhealth: true,
          governmentContributionPhilhealthBasis: true,
          governmentContributionPhilhealthPercentage: true,
          governmentContributionPhilhealthMinimum: true,
          governmentContributionPhilhealthMaximum: true,
          governmentContributionPhilhealthEmployeeShare: true,
          governmentContributionPhilhealthEmployerShare: true,
          governmentContributionPagibig: true,
          governmentContributionPagibigBasis: true,
          governmentContributionPagibigPercentage: true,
          governmentContributionPagibigMinimumShare: true,
          governmentContributionPagibigMinimumPercentage: true,
          governmentContributionPagibigMaximumEEShare: true,
          governmentContributionPagibigMaximumERShare: true,
          governmentContributionPagibigEmployeeShare: true,
          governmentContributionPagibigEmployerShare: true,
          governmentContributionTax: true,
          grossTaxableIncome: true,
          totalGovernmentContribution: true,
          totalNonTaxableGovernmentContribution: true,
          nonTaxableDeduction: true,
          taxableIncome: true,
          taxOffset: true,
          taxPercentage: true,
          taxByPercentage: true,
          taxFixedAmount: true,
          taxTotal: true,
          loans: true,
          totalDeduction: true,
          basicPay: true,
          basicPayMonthlyRate: true,
          grossPay: true,
          netPay: true,
        },
      });

    const cutoffDateRangeId = context.timekeepingCutoffData.cutoffDateRangeId;

    await this.prismaService.cutoffDateRange.update({
      where: {
        id: cutoffDateRangeId,
      },
      data: {
        // Format all values to 2 decimal places and convert to Number
        totalNetPay: Number(
          (totalSalaryComputation._sum.netPay ?? 0).toFixed(2),
        ),
        totalGrossPay: Number(
          (totalSalaryComputation._sum.grossPay ?? 0).toFixed(2),
        ),
        totalBasicPay: Number(
          (totalSalaryComputation._sum.basicPay ?? 0).toFixed(2),
        ),
        totalBasicSalary: Number(
          (totalSalaryComputation._sum.basicSalary ?? 0).toFixed(2),
        ),
        totalDeductionLate: Number(
          (totalSalaryComputation._sum.deductionLate ?? 0).toFixed(2),
        ),
        totalDeductionUndertime: Number(
          (totalSalaryComputation._sum.deductionUndertime ?? 0).toFixed(2),
        ),
        totalDeductionAbsent: Number(
          (totalSalaryComputation._sum.deductionAbsent ?? 0).toFixed(2),
        ),
        totalDeductionSalaryAdjustmnt: Number(
          (totalSalaryComputation._sum.deductionSalaryAdjustmnt ?? 0).toFixed(
            2,
          ),
        ),
        totalAdditionalDeduction: Number(
          (totalSalaryComputation._sum.totalAdditionalDeduction ?? 0).toFixed(
            2,
          ),
        ),
        totalDeduction: Number(
          (totalSalaryComputation._sum.totalDeduction ?? 0).toFixed(2),
        ),
        totalEarningOvertime: Number(
          (totalSalaryComputation._sum.earningOvertime ?? 0).toFixed(2),
        ),
        totalEarningNightDiff: Number(
          (totalSalaryComputation._sum.earningNightDifferential ?? 0).toFixed(
            2,
          ),
        ),
        totalEarningNightDiffOT: Number(
          (
            totalSalaryComputation._sum.earningNightDifferentialOvertime ?? 0
          ).toFixed(2),
        ),
        totalEarningRestDay: Number(
          (totalSalaryComputation._sum.earningRestDay ?? 0).toFixed(2),
        ),
        totalEarningRegularHoliday: Number(
          (totalSalaryComputation._sum.earningRegularHoliday ?? 0).toFixed(2),
        ),
        totalEarningSpecialHoliday: Number(
          (totalSalaryComputation._sum.earningSpecialHoliday ?? 0).toFixed(2),
        ),
        totalEarningSalaryAdjustment: Number(
          (totalSalaryComputation._sum.earningSalaryAdjustment ?? 0).toFixed(2),
        ),
        totalAdditionalEarnings: Number(
          (totalSalaryComputation._sum.totalAdditionalEarnings ?? 0).toFixed(2),
        ),
        totalAllowance: Number(
          (totalSalaryComputation._sum.allowance ?? 0).toFixed(2),
        ),
        totalTaxableAllowance: Number(
          (totalSalaryComputation._sum.taxableAllowance ?? 0).toFixed(2),
        ),
        totalNonTaxableAllowance: Number(
          (totalSalaryComputation._sum.nonTaxableAllowance ?? 0).toFixed(2),
        ),
        totalDeminimisAllowance: Number(
          (totalSalaryComputation._sum.deminimisAllowance ?? 0).toFixed(2),
        ),
        totalEarningsPlusAllowance: Number(
          (totalSalaryComputation._sum.earningsPlusAllowance ?? 0).toFixed(2),
        ),
        totalGovernmentContributionSSS: Number(
          (totalSalaryComputation._sum.governmentContributionSSS ?? 0).toFixed(
            2,
          ),
        ),
        totalGovernmentContributionSSSBasis: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSBasis ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSEER: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSEER ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSEREC: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSEREC ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSEEMPF: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSEEMPF ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSEETotal: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSEETotal ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSERR: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSERR ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSERMPF: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSERMPF ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSERTotal: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSERTotal ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSMSR: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSMSR ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSMSMPF: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSMSMPF ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionSSSMSTotal: Number(
          (
            totalSalaryComputation._sum.governmentContributionSSSMSTotal ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealth: Number(
          (
            totalSalaryComputation._sum.governmentContributionPhilhealth ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthBasis: Number(
          (
            totalSalaryComputation._sum.governmentContributionPhilhealthBasis ??
            0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthPercentage: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPhilhealthPercentage ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthMinimum: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPhilhealthMinimum ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthMaximum: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPhilhealthMaximum ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthEmployeeShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPhilhealthEmployeeShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPhilhealthEmployerShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPhilhealthEmployerShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibig: Number(
          (
            totalSalaryComputation._sum.governmentContributionPagibig ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigBasis: Number(
          (
            totalSalaryComputation._sum.governmentContributionPagibigBasis ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigPercentage: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigPercentage ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigMinimumShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigMinimumShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigMinimumPercentage: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigMinimumPercentage ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigMaximumEEShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigMaximumEEShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigMaximumERShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigMaximumERShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigEmployeeShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigEmployeeShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionPagibigEmployerShare: Number(
          (
            totalSalaryComputation._sum
              .governmentContributionPagibigEmployerShare ?? 0
          ).toFixed(2),
        ),
        totalGovernmentContributionTax: Number(
          (totalSalaryComputation._sum.governmentContributionTax ?? 0).toFixed(
            2,
          ),
        ),
        totalGrossTaxableIncome: Number(
          (totalSalaryComputation._sum.grossTaxableIncome ?? 0).toFixed(2),
        ),
        totalGovernmentContribution: Number(
          (
            totalSalaryComputation._sum.totalGovernmentContribution ?? 0
          ).toFixed(2),
        ),
        totalNonTaxableGovernmentContribution: Number(
          (
            totalSalaryComputation._sum.totalNonTaxableGovernmentContribution ??
            0
          ).toFixed(2),
        ),
        totalNonTaxableDeduction: Number(
          (totalSalaryComputation._sum.nonTaxableDeduction ?? 0).toFixed(2),
        ),
        totalTaxableIncome: Number(
          (totalSalaryComputation._sum.taxableIncome ?? 0).toFixed(2),
        ),
        totalTaxOffset: Number(
          (totalSalaryComputation._sum.taxOffset ?? 0).toFixed(2),
        ),
        totalTaxPercentage: Number(
          (totalSalaryComputation._sum.taxPercentage ?? 0).toFixed(2),
        ),
        totalTaxByPercentage: Number(
          (totalSalaryComputation._sum.taxByPercentage ?? 0).toFixed(2),
        ),
        totalTaxFixedAmount: Number(
          (totalSalaryComputation._sum.taxFixedAmount ?? 0).toFixed(2),
        ),
        totalTax: Number(
          (totalSalaryComputation._sum.taxTotal ?? 0).toFixed(2),
        ),
        totalLoans: Number((totalSalaryComputation._sum.loans ?? 0).toFixed(2)),
        totalBasicPayMonthlyRate: Number(
          (totalSalaryComputation._sum.basicPayMonthlyRate ?? 0).toFixed(2),
        ),
      },
    });
  }
}
