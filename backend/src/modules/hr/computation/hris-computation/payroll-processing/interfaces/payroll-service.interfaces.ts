import {
  EmployeeSalaryComputation,
  EmployeeSalaryComputationPerDay,
  EmployeeTimekeeping,
  EmployeeTimekeepingCutoff,
  CutoffDateRange,
  Cutoff,
} from '@prisma/client';
import {
  CutoffTypeReferenceResponse,
  DateFormat,
  EmployeeDataResponse,
} from '../../../../../../shared/response';

export interface PayrollContext {
  timekeepingCutoffId: number;
  employeeData: EmployeeDataResponse;
  employeeTimekeeping: EmployeeTimekeeping[];
  timekeepingCutoffData: EmployeeTimekeepingCutoff & {
    cutoffDateRange: CutoffDateRange;
  };
  previousTimekeepingCutoffData: EmployeeTimekeepingCutoff & {
    cutoffDateRange: CutoffDateRange;
  };
  previousEmployeeSalaryComputation: EmployeeSalaryComputation;
  employeeSalaryComputationPerDayBreakdown: EmployeeSalaryComputationPerDay[];
  employeeSalaryComputation: EmployeeSalaryComputation;
  dateBasis: DateFormat;
  cutoff: Cutoff;
  cutoffType: CutoffTypeReferenceResponse;
}

export interface SalaryRates {
  monthlyRate: number;
  dailyRate: number;
  cutoffRate: number;
  hourlyRate: number;
  totalWorkDaysInYear: number;
  dailyRateComputationMethod?: 'AUTO' | 'MANUAL';
  monthlyWorkingDays?: number;
  workingDaysPerWeek?: number;
}

export interface GovernmentContributionResult {
  sss: number;
  philhealth: number;
  pagibig: number;
  total: number;
}

export interface TaxComputationResult {
  taxableIncome: number;
  taxPercentage: number;
  taxByPercentage: number;
  taxOffset: number;
  taxFixedAmount: number;
  taxTotal: number;
}

export interface DeductionResult {
  loans: number;
  deductions: any[];
}
