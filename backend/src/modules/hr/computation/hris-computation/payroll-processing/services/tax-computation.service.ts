import { Injectable, Inject } from '@nestjs/common';
import { DeductionPeriod } from '@prisma/client';
import { TaxConfigurationService } from '@modules/hr/configuration/tax-configuration/tax-configuration.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

@Injectable()
export class TaxComputationService {
  @Inject() private readonly taxConfigurationService: TaxConfigurationService;

  async computeTax(context: PayrollContext): Promise<void> {
    this.calculateGrossTaxableIncome(context);
    this.calculateNonTaxableDeductions(context);
    this.calculateTaxableIncome(context);
    await this.applyTaxBracket(context);
  }

  private calculateGrossTaxableIncome(context: PayrollContext): void {
    context.employeeSalaryComputation.grossTaxableIncome = this.sumAll([
      context.employeeSalaryComputation.totalBasicSalary,
      context.employeeSalaryComputation.taxableAllowance,
      context.employeeSalaryComputation.totalAdditionalEarnings,
    ]);
  }

  private calculateNonTaxableDeductions(context: PayrollContext): void {
    context.employeeSalaryComputation.totalNonTaxableGovernmentContribution =
      this.sumAll([
        context.employeeSalaryComputation.governmentContributionSSS,
        context.employeeSalaryComputation.governmentContributionPhilhealth,
        context.employeeSalaryComputation.governmentContributionPagibig,
      ]);

    context.employeeSalaryComputation.nonTaxableDeduction = this.sumAll([
      context.employeeSalaryComputation.totalNonTaxableGovernmentContribution,
      context.employeeSalaryComputation.totalDeduction,
    ]);
  }

  private calculateTaxableIncome(context: PayrollContext): void {
    context.employeeSalaryComputation.taxableIncomeCurrent = this.sumAll([
      context.employeeSalaryComputation.grossTaxableIncome,
      -context.employeeSalaryComputation.nonTaxableDeduction,
    ]);

    context.employeeSalaryComputation.taxableIncomePrevious =
      context.previousEmployeeSalaryComputation?.taxableIncomeCurrent || 0;

    if (context.employeeSalaryComputation.taxableIncome < 0) {
      context.employeeSalaryComputation.taxableIncome = 0;
    }

    const deductionPeriod =
      context.employeeSalaryComputation.deductionPeriodWitholdingTax;

    context.employeeSalaryComputation.taxableIncome = 0;

    if (deductionPeriod == DeductionPeriod.EVERY_PERIOD) {
      context.employeeSalaryComputation.taxableIncome =
        context.employeeSalaryComputation.taxableIncomeCurrent;
    } else if (
      deductionPeriod == DeductionPeriod.FIRST_PERIOD ||
      deductionPeriod == DeductionPeriod.LAST_PERIOD
    ) {
      if (
        deductionPeriod ==
        context.timekeepingCutoffData.cutoffDateRange.cutoffPeriodType
      ) {
        context.employeeSalaryComputation.taxableIncome =
          context.employeeSalaryComputation.taxableIncomeCurrent +
          context.employeeSalaryComputation.taxableIncomePrevious;
      }
    }
  }

  private async applyTaxBracket(context: PayrollContext): Promise<void> {
    const taxBracket = await this.taxConfigurationService.taxBracket({
      date: context.dateBasis.dateStandard,
      type: context.cutoffType.key,
      taxableIncome: context.employeeSalaryComputation.taxableIncome,
    });

    context.employeeSalaryComputation.taxPercentage =
      taxBracket.bracket.percentage;
    context.employeeSalaryComputation.taxByPercentage =
      taxBracket.taxByPercentage;
    context.employeeSalaryComputation.taxOffset = taxBracket.taxOffset;
    context.employeeSalaryComputation.taxFixedAmount = taxBracket.taxFix;
    context.employeeSalaryComputation.taxTotal = taxBracket.taxTotal;
    context.employeeSalaryComputation.governmentContributionTax =
      taxBracket.taxTotal;

    this.computeTotalGovernmentContribution(context);
  }

  private computeTotalGovernmentContribution(context: PayrollContext) {
    context.employeeSalaryComputation.totalGovernmentContribution = this.sumAll(
      [
        context.employeeSalaryComputation.governmentContributionSSS,
        context.employeeSalaryComputation.governmentContributionPhilhealth,
        context.employeeSalaryComputation.governmentContributionPagibig,
        context.employeeSalaryComputation.governmentContributionTax,
      ],
    );
  }

  private sumAll(numbers: number[]): number {
    return Number(numbers.reduce((acc, num) => acc + num, 0).toFixed(2));
  }
}
