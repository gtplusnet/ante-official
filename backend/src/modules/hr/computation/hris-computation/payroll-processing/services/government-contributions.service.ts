import { Injectable, Inject } from '@nestjs/common';
import { DeductionTargetBasis } from '@prisma/client';
import { SssConfigurationService } from '@modules/hr/configuration/sss-configuration/sss-configuration.service';
import { PhilhealtConfigurationService } from '@modules/hr/configuration/philhealth-configuration/philhealth-configuration.service';
import { PagibigConfigurationService } from '@modules/hr/configuration/pagibig-configuration/pagibig-configuration.service';
import { PagibigConfigurationReponse } from '../../../../../../shared/response';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';
import { PayrollRatesService } from './payroll-rates.service';

@Injectable()
export class GovernmentContributionsService {
  @Inject() private readonly sssConfigurationService: SssConfigurationService;
  @Inject()
  private readonly philhealthConfigurationService: PhilhealtConfigurationService;
  @Inject()
  private readonly pagibigConfigurationService: PagibigConfigurationService;
  @Inject() private readonly payrollRatesService: PayrollRatesService;

  async computeGovernmentContributions(context: PayrollContext): Promise<void> {
    await this.computeSSS(context);
    await this.computePhilhealth(context);
    await this.computePagibig(context);
  }

  private async computeSSS(context: PayrollContext): Promise<void> {
    let sssBasisAmount = 0;
    let previousSSSBasisAmount = 0;
    let currentSSSBasisAmount = 0;
    const deductionPeriod =
      context.employeeSalaryComputation.deductionPeriodSSS;
    let divisor = await this.payrollRatesService.computeDivisor(
      deductionPeriod,
      context,
    );

    // SSS Basis
    switch (context.employeeSalaryComputation.deductionBasisSSS) {
      case DeductionTargetBasis.BASIC_PAY:
        previousSSSBasisAmount =
          context.previousEmployeeSalaryComputation?.basicPay || 0;
        currentSSSBasisAmount = context.employeeSalaryComputation.basicPay;
        sssBasisAmount =
          divisor == 2
            ? currentSSSBasisAmount
            : divisor == 1
              ? previousSSSBasisAmount + currentSSSBasisAmount
              : 0;
        divisor = divisor == 2 ? 1 : divisor;
        break;
      case DeductionTargetBasis.PRO_RATED_BASIC_PAY:
        previousSSSBasisAmount =
          context.previousEmployeeSalaryComputation?.basicPay || 0;
        currentSSSBasisAmount = context.employeeSalaryComputation.basicPay;
        sssBasisAmount =
          divisor == 2
            ? currentSSSBasisAmount
            : divisor == 1
              ? previousSSSBasisAmount + currentSSSBasisAmount
              : 0;
        divisor = divisor == 2 ? 1 : divisor;
        break;
      case DeductionTargetBasis.GROSS_PAY:
        previousSSSBasisAmount =
          context.previousEmployeeSalaryComputation?.grossPay || 0;
        currentSSSBasisAmount = context.employeeSalaryComputation.grossPay;
        sssBasisAmount =
          divisor == 2
            ? currentSSSBasisAmount
            : divisor == 1
              ? previousSSSBasisAmount + currentSSSBasisAmount
              : 0;
        divisor = divisor == 2 ? 1 : divisor;
        break;
      case DeductionTargetBasis.BASIC_SALARY:
        previousSSSBasisAmount =
          context.previousEmployeeSalaryComputation?.monthlyRate || 0;
        currentSSSBasisAmount = context.employeeSalaryComputation.monthlyRate;
        sssBasisAmount = context.employeeSalaryComputation.monthlyRate;
        break;
    }

    const sssBracketData =
      await this.sssConfigurationService.getSSSConfigurationByDateAndSalary({
        date: context.dateBasis.dateStandard,
        salary: sssBasisAmount,
      });

    context.employeeSalaryComputation.governmentContributionSSSBasis =
      sssBasisAmount;

    if (divisor > 0) {
      context.employeeSalaryComputation.governmentContributionSSS =
        sssBracketData.contributionAmount.employee.total / divisor;
      context.employeeSalaryComputation.governmentContributionSSSEER =
        sssBracketData.contributionAmount.employee.regular / divisor;
      context.employeeSalaryComputation.governmentContributionSSSEREC =
        sssBracketData.contributionAmount.employer.ec / divisor;
      context.employeeSalaryComputation.governmentContributionSSSEEMPF =
        sssBracketData.contributionAmount.employee.mpf / divisor;
      context.employeeSalaryComputation.governmentContributionSSSEETotal =
        sssBracketData.contributionAmount.employee.total / divisor;
      context.employeeSalaryComputation.governmentContributionSSSERR =
        sssBracketData.contributionAmount.employer.regular / divisor;
      context.employeeSalaryComputation.governmentContributionSSSERMPF =
        sssBracketData.contributionAmount.employer.mpf / divisor;
      context.employeeSalaryComputation.governmentContributionSSSERTotal =
        sssBracketData.contributionAmount.employer.total / divisor;
      context.employeeSalaryComputation.governmentContributionSSSMSR =
        sssBracketData.monthlySalaryCredit.regular / divisor;
      context.employeeSalaryComputation.governmentContributionSSSMSMPF =
        sssBracketData.monthlySalaryCredit.mpf / divisor;
      context.employeeSalaryComputation.governmentContributionSSSMSTotal =
        sssBracketData.monthlySalaryCredit.total / divisor;
    } else {
      context.employeeSalaryComputation.governmentContributionSSS = 0;
      context.employeeSalaryComputation.governmentContributionSSSEER = 0;
      context.employeeSalaryComputation.governmentContributionSSSEREC = 0;
      context.employeeSalaryComputation.governmentContributionSSSEEMPF = 0;
      context.employeeSalaryComputation.governmentContributionSSSEETotal = 0;
      context.employeeSalaryComputation.governmentContributionSSSERR = 0;
      context.employeeSalaryComputation.governmentContributionSSSERMPF = 0;
      context.employeeSalaryComputation.governmentContributionSSSERTotal = 0;
      context.employeeSalaryComputation.governmentContributionSSSMSR = 0;
      context.employeeSalaryComputation.governmentContributionSSSMSMPF = 0;
      context.employeeSalaryComputation.governmentContributionSSSMSTotal = 0;
      context.employeeSalaryComputation.governmentContributionSSSBasisPrevious = 0;
      context.employeeSalaryComputation.governmentContributionSSSBasicCurrent = 0;
    }

    context.employeeSalaryComputation.governmentContributionSSSBasisPrevious =
      previousSSSBasisAmount;
    context.employeeSalaryComputation.governmentContributionSSSBasicCurrent =
      currentSSSBasisAmount;
  }

  private async computePhilhealth(context: PayrollContext): Promise<void> {
    const deductionPeriod =
      context.employeeSalaryComputation.deductionPeriodPhilhealth;
    let philhealthDivisor = await this.payrollRatesService.computeDivisor(
      deductionPeriod,
      context,
    );

    let philhealthBasisAmount = 0;
    let previousPhilhealthBasisAmount = 0;
    let currentPhilhealthBasisAmount = 0;

    // Philhealth Basis
    switch (context.employeeSalaryComputation.deductionBasisPhilhealth) {
      case DeductionTargetBasis.BASIC_PAY:
        previousPhilhealthBasisAmount =
          context.previousEmployeeSalaryComputation?.basicPay || 0;
        currentPhilhealthBasisAmount =
          context.employeeSalaryComputation.basicPay;
        philhealthBasisAmount =
          philhealthDivisor == 2
            ? currentPhilhealthBasisAmount
            : philhealthDivisor == 1
              ? previousPhilhealthBasisAmount + currentPhilhealthBasisAmount
              : 0;
        philhealthDivisor = philhealthDivisor == 2 ? 1 : philhealthDivisor;
        break;
      case DeductionTargetBasis.PRO_RATED_BASIC_PAY:
        previousPhilhealthBasisAmount =
          context.previousEmployeeSalaryComputation?.basicPay || 0;
        currentPhilhealthBasisAmount =
          context.employeeSalaryComputation.basicPay;
        philhealthBasisAmount =
          philhealthDivisor == 2
            ? currentPhilhealthBasisAmount
            : philhealthDivisor == 1
              ? previousPhilhealthBasisAmount + currentPhilhealthBasisAmount
              : 0;
        philhealthDivisor = philhealthDivisor == 2 ? 1 : philhealthDivisor;
        break;
      case DeductionTargetBasis.GROSS_PAY:
        previousPhilhealthBasisAmount =
          context.previousEmployeeSalaryComputation?.grossPay || 0;
        currentPhilhealthBasisAmount =
          context.employeeSalaryComputation.grossPay;
        philhealthBasisAmount =
          philhealthDivisor == 2
            ? currentPhilhealthBasisAmount
            : philhealthDivisor == 1
              ? previousPhilhealthBasisAmount + currentPhilhealthBasisAmount
              : 0;
        philhealthDivisor = philhealthDivisor == 2 ? 1 : philhealthDivisor;
        break;
      case DeductionTargetBasis.BASIC_SALARY:
        previousPhilhealthBasisAmount =
          context.previousEmployeeSalaryComputation?.monthlyRate || 0;
        currentPhilhealthBasisAmount =
          context.employeeSalaryComputation.monthlyRate;
        philhealthBasisAmount =
          philhealthDivisor == 2
            ? currentPhilhealthBasisAmount
            : philhealthDivisor == 1
              ? previousPhilhealthBasisAmount + currentPhilhealthBasisAmount
              : 0;
        break;
    }

    if (philhealthDivisor > 0) {
      const philhealthBracketData =
        await this.philhealthConfigurationService.getPhilhealthBracket({
          date: context.dateBasis.dateStandard,
          salary: philhealthBasisAmount,
        });

      const percentage = philhealthBracketData.dateBracketData.percentage;
      const minimumContribution =
        philhealthBracketData.dateBracketData.minimumContribution;
      const maximumContribution =
        philhealthBracketData.dateBracketData.maximumContribution;
      const employeeShare =
        philhealthBracketData.employeeShare / philhealthDivisor / 2;
      const employerShare =
        philhealthBracketData.employerShare / philhealthDivisor / 2;

      context.employeeSalaryComputation.governmentContributionPhilhealthBasis =
        philhealthBasisAmount;
      context.employeeSalaryComputation.governmentContributionPhilhealth =
        employeeShare;
      context.employeeSalaryComputation.governmentContributionPhilhealthPercentage =
        percentage;
      context.employeeSalaryComputation.governmentContributionPhilhealthMinimum =
        minimumContribution;
      context.employeeSalaryComputation.governmentContributionPhilhealthMaximum =
        maximumContribution;
      context.employeeSalaryComputation.governmentContributionPhilhealthEmployeeShare =
        employeeShare;
      context.employeeSalaryComputation.governmentContributionPhilhealthEmployerShare =
        employerShare;
    } else {
      context.employeeSalaryComputation.governmentContributionPhilhealth = 0;
      context.employeeSalaryComputation.governmentContributionPhilhealthPercentage = 0;
      context.employeeSalaryComputation.governmentContributionPhilhealthMinimum = 0;
      context.employeeSalaryComputation.governmentContributionPhilhealthMaximum = 0;
      context.employeeSalaryComputation.governmentContributionPhilhealthEmployeeShare = 0;
      context.employeeSalaryComputation.governmentContributionPhilhealthEmployerShare = 0;
    }

    context.employeeSalaryComputation.governmentContributionPhilhealthBasisPrevious =
      previousPhilhealthBasisAmount;
    context.employeeSalaryComputation.governmentContributionPhilhealthBasicCurrent =
      currentPhilhealthBasisAmount;
  }

  private async computePagibig(context: PayrollContext): Promise<void> {
    const pagibigBasisAmount = context.employeeSalaryComputation.monthlyRate;
    const previousPagibigBasisAmount =
      context.previousEmployeeSalaryComputation?.monthlyRate || 0;
    const currentPagibigBasisAmount =
      context.employeeSalaryComputation.monthlyRate;
    const deductionPeriod =
      context.employeeSalaryComputation.deductionPeriodPagibig;
    const divisor = await this.payrollRatesService.computeDivisor(
      deductionPeriod,
      context,
    );

    const pagibigBracketData: PagibigConfigurationReponse =
      await this.pagibigConfigurationService.getPagibigBracket({
        date: context.dateBasis.dateStandard,
        salary: pagibigBasisAmount,
      });

    context.employeeSalaryComputation.governmentContributionPagibigBasis =
      pagibigBasisAmount;

    if (divisor > 0) {
      context.employeeSalaryComputation.governmentContributionPagibig =
        pagibigBracketData.employeeShare / divisor;
      context.employeeSalaryComputation.governmentContributionPagibigEmployerShare =
        pagibigBracketData.employerShare / divisor;
      context.employeeSalaryComputation.governmentContributionPagibigEmployeeShare =
        pagibigBracketData.employeeShare / divisor;
      context.employeeSalaryComputation.governmentContributionPagibigMaximumEEShare =
        pagibigBracketData.maximumEmployeeShare;
      context.employeeSalaryComputation.governmentContributionPagibigMaximumERShare =
        pagibigBracketData.maximumEmployerShare;
      context.employeeSalaryComputation.governmentContributionPagibigMinimumPercentage =
        pagibigBracketData.employeeMinimumPercentage;
      context.employeeSalaryComputation.governmentContributionPagibigMinimumShare =
        pagibigBracketData.employeeMinimumShare;
      context.employeeSalaryComputation.governmentContributionPagibigPercentage =
        pagibigBracketData.percentage;
      context.employeeSalaryComputation.governmentContributionPagibigBasisPrevious =
        previousPagibigBasisAmount;
      context.employeeSalaryComputation.governmentContributionPagibigBasicCurrent =
        currentPagibigBasisAmount;
    } else {
      context.employeeSalaryComputation.governmentContributionPagibig = 0;
      context.employeeSalaryComputation.governmentContributionPagibigEmployerShare = 0;
      context.employeeSalaryComputation.governmentContributionPagibigEmployeeShare = 0;
      context.employeeSalaryComputation.governmentContributionPagibigMaximumEEShare = 0;
      context.employeeSalaryComputation.governmentContributionPagibigMaximumERShare = 0;
      context.employeeSalaryComputation.governmentContributionPagibigMinimumPercentage = 0;
      context.employeeSalaryComputation.governmentContributionPagibigMinimumShare = 0;
      context.employeeSalaryComputation.governmentContributionPagibigPercentage = 0;
    }
  }

  private sumAll(numbers: number[]): number {
    return Number(numbers.reduce((acc, num) => acc + num, 0).toFixed(2));
  }
}
