import { Injectable, Inject } from '@nestjs/common';
import { SalaryRateType } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';
import { PayrollRatesService } from './payroll-rates.service';

@Injectable()
export class CutoffSalaryComputationService {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly payrollRatesService: PayrollRatesService;

  async computeCutoffSalary(context: PayrollContext): Promise<void> {
    const salaryRates = await this.payrollRatesService.getSalaryRates(
      context,
      8,
    );

    // Set basic salary rates
    context.employeeSalaryComputation.monthlyRate = salaryRates.monthlyRate;
    context.employeeSalaryComputation.cutoffRate = salaryRates.cutoffRate;
    context.employeeSalaryComputation.dailyRate = salaryRates.dailyRate;
    context.employeeSalaryComputation.hourlyRate = salaryRates.hourlyRate;

    // Calculate basic salary based on salary rate type
    if (context.employeeSalaryComputation.salaryRateType === SalaryRateType.DAILY_RATE) {
      // Sum up daily rates from per-day breakdown
      context.employeeSalaryComputation.basicSalary = this.sumAll(
        context.employeeSalaryComputationPerDayBreakdown.map((day) => day.dailyRate)
      );

    } else {
      // Keep existing logic for monthly/fixed rate
      context.employeeSalaryComputation.basicSalary = salaryRates.cutoffRate;
    }

    // Calculate total basic salary
    context.employeeSalaryComputation.totalBasicSalary =
      context.employeeSalaryComputation.basicSalary +
      context.employeeSalaryComputation.earningSalaryAdjustment -
      context.employeeSalaryComputation.deductionSalaryAdjustmnt;

    // Sum up values from daily computations
    this.aggregateDailyComputations(context);

    // Calculate basic pay based on salary rate type
    this.calculateBasicPay(context);

    // Gross pay calculation moved after allowances computation
  }

  private aggregateDailyComputations(context: PayrollContext): void {
    const dailyBreakdown = context.employeeSalaryComputationPerDayBreakdown;

    context.employeeSalaryComputation.basicPay = this.sumAll(
      dailyBreakdown.map((day) => day.basicPay),
    );
    context.employeeSalaryComputation.deductionLate = this.sumAll(
      dailyBreakdown.map((day) => day.deductionLate),
    );
    context.employeeSalaryComputation.deductionUndertime = this.sumAll(
      dailyBreakdown.map((day) => day.deductionUndertime),
    );
    context.employeeSalaryComputation.deductionAbsent = this.sumAll(
      dailyBreakdown.map((day) => day.deductionAbsent),
    );
    context.employeeSalaryComputation.totalDeduction = this.sumAll(
      dailyBreakdown.map((day) => day.totalDeduction),
    );
    context.employeeSalaryComputation.earningOvertime = this.sumAll(
      dailyBreakdown.map((day) => day.earningOvertime),
    );
    context.employeeSalaryComputation.earningNightDifferential = this.sumAll(
      dailyBreakdown.map((day) => day.earningNightDifferential),
    );
    context.employeeSalaryComputation.earningNightDifferentialOvertime =
      this.sumAll(
        dailyBreakdown.map((day) => day.earningNightDifferentialOvertime),
      );
    context.employeeSalaryComputation.earningRestDay = this.sumAll(
      dailyBreakdown.map((day) => day.earningRestDay),
    );
    context.employeeSalaryComputation.earningRegularHoliday = this.sumAll(
      dailyBreakdown.map((day) => day.earningRegularHoliday),
    );
    context.employeeSalaryComputation.earningSpecialHoliday = this.sumAll(
      dailyBreakdown.map((day) => day.earningSpecialHoliday),
    );
    context.employeeSalaryComputation.totalAdditionalEarnings = this.sumAll(
      dailyBreakdown.map((day) => day.totalAdditionalEarnings),
    );
  }

  private calculateBasicPay(context: PayrollContext): void {
    if (
      context.employeeSalaryComputation.salaryRateType ===
      SalaryRateType.MONTHLY_RATE
    ) {
      context.employeeSalaryComputation.basicPay = this.sumAll([
        context.employeeSalaryComputation.basicSalary,
        -context.employeeSalaryComputation.totalDeduction,
      ]);
    } else if (
      context.employeeSalaryComputation.salaryRateType ===
      SalaryRateType.DAILY_RATE
    ) {
      // For daily rate, basicPay is already calculated from daily computations
      // The aggregateDailyComputations method already summed up the daily basicPay values
      // No additional calculation needed here as it's already correct
    } else if (
      context.employeeSalaryComputation.salaryRateType ===
      SalaryRateType.FIXED_RATE
    ) {
      // Reset deductions and earnings for fixed rate
      context.employeeSalaryComputation.deductionLate = 0;
      context.employeeSalaryComputation.deductionUndertime = 0;
      context.employeeSalaryComputation.deductionAbsent = 0;
      context.employeeSalaryComputation.earningOvertime = 0;
      context.employeeSalaryComputation.earningNightDifferential = 0;
      context.employeeSalaryComputation.earningNightDifferentialOvertime = 0;
      context.employeeSalaryComputation.earningRestDay = 0;
      context.employeeSalaryComputation.totalDeduction = 0;
      context.employeeSalaryComputation.totalAdditionalEarnings = 0;

      context.employeeSalaryComputation.basicPay = this.sumAll([
        context.employeeSalaryComputation.basicSalary,
      ]);
      context.employeeSalaryComputation.totalBasicSalary = this.sumAll([
        context.employeeSalaryComputation.basicSalary,
      ]);
    }
  }

  calculateGrossPay(context: PayrollContext): void {
    context.employeeSalaryComputation.grossPay = this.sumAll([
      context.employeeSalaryComputation.basicPay,
      context.employeeSalaryComputation.totalAdditionalEarnings,
      context.employeeSalaryComputation.allowance,
    ]);
  }

  calculateNetPay(context: PayrollContext): void {
    // Compute total deductions
    context.employeeSalaryComputation.totalAdditionalDeduction = this.sumAll([
      context.employeeSalaryComputation.totalGovernmentContribution,
      context.employeeSalaryComputation.loans,
    ]);

    // Net pay computation
    context.employeeSalaryComputation.netPay = this.sumAll([
      context.employeeSalaryComputation.grossPay,
      -context.employeeSalaryComputation.totalAdditionalDeduction,
    ]);

    if (context.employeeSalaryComputation.netPay < 0) {
      context.employeeSalaryComputation.netPay = 0;
    }

    const netPayFormatted = this.utilityService.formatCurrency(
      context.employeeSalaryComputation.netPay,
    );

    this.utilityService.log(
      `Payroll Computation (${context.employeeSalaryComputation.employeeTimekeepingCutoffId}): ${context.employeeData.accountDetails.email} computed for ${context.dateBasis.dateFull}. The net pay is ${netPayFormatted.formatCurrency}`,
    );
  }

  private sumAll(numbers: number[]): number {
    return Number(numbers.reduce((acc, num) => acc + num, 0).toFixed(2));
  }
}
