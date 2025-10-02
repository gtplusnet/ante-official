import {
  EmployeeSalaryComputation,
  EmployeeSalaryComputationDeductions,
  EmployeeSalaryComputationAllowances,
  GovernmentPaymentType,
} from '@prisma/client';

export interface PostedPayrollContext {
  cutoffDateRangeId: string;
  employeeTimekeepingCutoffIds: number[];
  isReposting?: boolean;
}

export interface PostingResult {
  success: boolean;
  processedCount: number;
  errors: PostingError[];
}

export interface PostingError {
  employeeTimekeepingCutoffId: number;
  accountId: string;
  error: string;
  type: 'deduction' | 'allowance' | 'loan' | 'government';
}

export interface DeductionPostingData {
  deduction: EmployeeSalaryComputationDeductions;
  employeeSalaryComputation: EmployeeSalaryComputation;
  cutoffDateRangeId: string;
}

export interface AllowancePostingData {
  allowance: EmployeeSalaryComputationAllowances;
  employeeSalaryComputation: EmployeeSalaryComputation;
  cutoffDateRangeId: string;
}

export interface GovernmentPaymentData {
  type: GovernmentPaymentType;
  amount: number;
  employeeShare: number;
  employerShare: number;
  basis: number;
  cutoffDateRangeId: string;
  employeeTimekeepingCutoffId: number;
  accountId: string;
}

export interface LoanPaymentData {
  deductionPlanId: number;
  amount: number;
  cutoffDateRangeId: string;
  remarks: string;
}
