import { DateFormat, HoursFormat, PercentageFormat } from './utility.format';
import { SalaryRateTypeReferenceResponse } from './payroll-group.response';
import { DeductionBasisReferenceReponse } from './payroll-group.response';
import { CutoffTypeReferenceResponse } from './cutoff.response';
import { DeductionPeriodReferenceResponse } from './payroll-group.response';
import { EmployeeDataResponse } from './employee.response';
import { DeductionPlanConfigurationDataResponse } from './deduction-configuration.response';
import { DeductionType } from '@prisma/client';

export { DeductionType };

export interface SalaryInformationListResponse {
  employeeInformation: EmployeeDataResponse;
  salaryComputation: PayrollProcessingResponse;
}

export interface PayrollProcessingResponse {
  timekeepingCutoffId: number;
  salaryRate: SalaryRate;
  summary: {
    cutoffType: CutoffTypeReferenceResponse;
    salaryRateType: SalaryRateTypeReferenceResponse;
    deductionPeriodWitholdingTax: DeductionPeriodReferenceResponse;
    deductionPeriodSSS: DeductionPeriodReferenceResponse;
    deductionPeriodPhilhealth: DeductionPeriodReferenceResponse;
    deductionPeriodPagibig: DeductionPeriodReferenceResponse;
    deductionBasisSSS: DeductionBasisReferenceReponse;
    deductionBasisPhilhealth: DeductionBasisReferenceReponse;
    basicPay: number;
    contributions: {
      sss: number;
      philhealth: number;
      pagibig: number;
      pagibigAmountBasis: number;
      pagibigAmountBasisPrevious: number;
      pagibigAmountBasisCurrent: number;
      pagibigBreakdown: {
        percentage: PercentageFormat;
        employee: {
          minimum: number;
          minimumPercentage: PercentageFormat;
          maximum: number;
          contribution: number;
        };
        employer: {
          maximum: number;
          contribution: number;
        };
        total: number;
      };
      withholdingTax: number;
      sssAmountBasis: number;
      sssAmountBasisPrevious: number;
      sssAmountBasisCurrent: number;
      sssBreakdown: {
        employee: SSSBreakdown;
        employer: SSSBreakdown;
        monthlySalaryCredit: SSSBreakdown;
      };
      philhealthAmountBasis: number;
      philhealthAmountBasisPrevious: number;
      philhealthAmountBasisCurrent: number;
      philhealthBreakdown: {
        employeeShare: number;
        employerShare: number;
        minimumContribution: number;
        maximumContribution: number;
        percentage: PercentageFormat;
        total: number;
      };
    };
    taxComputationBreakdown: {
      totalBasicSalary: number;
      totalEarnings: number;
      totalTaxableAllowance: number;
      grossTaxableIncome: number;
      nonTaxableGovernmentContribution: number;
      totalDeduction: number;
      nonTaxableDeduction: number;
      taxableIncome: number;
      taxableIncomePrevious: number;
      taxableIncomeCurrent: number;
      taxOffset: number;
      taxByPercentage: number;
      taxPercentage: PercentageFormat;
      taxFixedAmount: number;
      taxTotal: number;
    };
    basicSalary: number;
    totalBasicSalary: number;
    basicPayBeforeAdjustment: number;
    salaryAdjustmentEarnings: number;
    salaryAdjustmentDeductions: number;
    salaryAdjustment: number;
    totalSalaryAdjustment: number;
    totalGovernmentContribution: number;
    additionalEarnings: PayrollProcessingEarningsResponse;
    totalDeduction: number;
    totalAdditionalDeduction: number;
    taxableAllowance: number;
    nonTaxableAllowance: number;
    totalAllowance: number;
    totalLoan: number;
    deductions: PayrollProcessingDeductionsResponse;
    grossPay: number;
    netPay: number;
  };
  dayBreakdown: PayrollProcessingDayResponse[];
}

export interface SSSBreakdown {
  regular: number;
  ec?: number;
  mandatoryProvidentFund: number;
  total: number;
}

export interface SalaryRate {
  monthlyRate: number;
  cutoffRate: number;
  dailyRate: number;
  hourlyRate: number;
}
export interface PayrollProcessingDayResponse {
  timekeepingId: number;
  dailyRate: number;
  date: DateFormat;
  rates: PayrollProcessingRateResponse;
  additionalEarnings: PayrollProcessingEarningsResponse;
  deductions: PayrollProcessingDeductionsResponse;
  totalWorkDaysInYear: number;
  totalWorkDaysInYearBreakdown: PayrollProcessingTotalWorkDaysInYearBreakdown;
  basicPay: number;
  dailyRateComputationMethod?: 'AUTO' | 'MANUAL';
  monthlyWorkingDays?: number;
  workingDaysPerWeek?: number;
  hasApprovedLeave?: boolean;
  leaveType?: string;
  leaveCompensationType?: string;
}

export interface PayrollProcessingTotalWorkDaysInYearBreakdown {
  monday: number;
  isMondayWorkDay: boolean;
  tuesday: number;
  isTuesdayWorkDay: boolean;
  wednesday: number;
  isWednesdayWorkDay: boolean;
  thursday: number;
  isThursdayWorkDay: boolean;
  friday: number;
  isFridayWorkDay: boolean;
  saturday: number;
  isSaturdayWorkDay: boolean;
  sunday: number;
  isSundayWorkDay: boolean;
}

export interface PayrollProcessingRateResponse {
  rateRestDay: number;
  rateOvertime: number;
  rateNightDifferential: number;
  rateNightDifferentialOvertime: number;
  rateRegularHoliday: number;
  rateSpecialHoliday: number;
}

export interface PayrollProcessingDeductionsResponse {
  absent: number;
  undertime: number;
  timeUndertime: HoursFormat;
  late: number;
  timeLate: HoursFormat;
  total: number;
}

export interface PayrollProcessingEarningsResponse {
  overtime: number;
  overtimeRaw: number;
  timeOvertime: HoursFormat;
  nightDifferential: number;
  nightDifferentialRaw: number;
  timeNightDifferential: HoursFormat;
  nightDifferentialOvertime: number;
  nightDifferentialOvertimeRaw: number;
  timeNightDifferentialOvertime: HoursFormat;
  regularHoliday: number;
  specialHoliday: number;
  restDay: number;
  total: number;
}

export interface EmployeeSalaryComputationDeductionsResponse {
  deductionPlan: DeductionPlanConfigurationDataResponse;
  amount: number;
}

export interface EmployeeSalaryComputationAllowancesResponse {
  allowancePlan: any; // TODO: Add proper AllowancePlanConfigurationDataResponse type
  amount: number;
}

export interface CutoffListCountResponse {
  pending: number;
  processed: number;
  approved: number;
  rejected: number;
}

export interface PayrollSummaryTotalsResponse {
  basicSalary: number;
  deductionLate: number;
  deductionUndertime: number;
  deductionAbsent: number;
  basicPay: number;
  allowance: number;
  holiday: number;
  overtime: number;
  nightDiff: number;
  restDay: number;
  manualEarnings: number;
  grossPay: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  tax: number;
  loans: number;
  manualDeductions: number;
  netPay: number;
  totalEmployees: number;
}

// Optimized response types for payroll summary list
export interface PayrollSummaryEmployeeInfo {
  accountId: string;
  employeeCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  branchName: string;
  payrollGroupCode: string;
}

export interface PayrollSummarySalaryInfo {
  timekeepingCutoffId: number;
  basicSalary: number;
  deductionLate: number;
  deductionUndertime: number;
  deductionAbsent: number;
  basicPay: number;
  allowance: number;
  earningRegularHoliday: number;
  earningSpecialHoliday: number;
  earningOvertime: number;
  earningNightDifferential: number;
  earningNightDifferentialOvertime: number;
  earningRestDay: number;
  earningSalaryAdjustment: number;
  grossPay: number;
  governmentContributionSSS: number;
  governmentContributionPhilhealth: number;
  governmentContributionPagibig: number;
  governmentContributionTax: number;
  loans: number;
  totalDeduction: number;
  netPay: number;
}

export interface PayrollSummaryListItem {
  employee: PayrollSummaryEmployeeInfo;
  salary: PayrollSummarySalaryInfo;
}
