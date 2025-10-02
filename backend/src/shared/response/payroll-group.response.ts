import { CutoffDataResponse } from './cutoff.response';
import {
  SalaryRateType,
  DeductionPeriod,
  DeductionType,
  DeductionTargetBasis,
} from '@prisma/client';
import { DeductionTimeBasis } from '../enums/deduction-time-basis.enum';

export interface OvertimeRateFactors {
  workDay: OvertimeRateFactorsHoliday;
  restDay: OvertimeRateFactorsHoliday;
}

export interface OvertimeRateFactorsHoliday {
  nonHoliday: OvertimeRateFactorsBreakdown;
  regularHoliday: OvertimeRateFactorsBreakdown;
  specialHoliday: OvertimeRateFactorsBreakdown;
  doubleHoliday: OvertimeRateFactorsBreakdown;
}

export interface PayrollGroupDataResponse {
  id: number;
  payrollGroupCode: string;
  cutoff: CutoffDataResponse;
  salaryRateType: SalaryRateTypeReferenceResponse;
  deductionBasisSSS: DeductionBasisReferenceReponse;
  deductionBasisPhilhealth: DeductionBasisReferenceReponse;
  deductionPeriodWitholdingTax: DeductionPeriodReferenceResponse;
  deductionPeriodSSS: DeductionPeriodReferenceResponse;
  deductionPeriodPhilhealth: DeductionPeriodReferenceResponse;
  deductionPeriodPagibig: DeductionPeriodReferenceResponse;
  lateDeductionType: DeductionTypeReferenceResponse;
  lateDeductionCustom: CustomDeductionResponse;
  undertimeDeductionType: DeductionTypeReferenceResponse;
  undertimeDeductionCustom: CustomDeductionResponse;
  absentDeductionHours: number;
  shiftingWorkingDaysPerWeek: number;
  lateGraceTimeMinutes: number;
  undertimeGraceTimeMinutes: number;
  overtimeGraceTimeMinutes: number;
  overtimeRateFactors: OvertimeRateFactors;
}

export interface OvertimeRateFactorsBreakdown {
  noOvertime: number;
  withOvertime: number;
  withNightDifferential: number;
  withNightDifferentialAndOvertime: number;
}

export interface SalaryRateTypeReferenceResponse {
  key: SalaryRateType;
  label: string;
}

export interface DeductionPeriodReferenceResponse {
  key: DeductionPeriod;
  label: string;
}

export interface DeductionTypeReferenceResponse {
  key: DeductionType;
  label: string;
}

export interface DeductionTimeBasisResponse {
  key: DeductionTimeBasis;
  label: string;
}

export interface CustomDeductionResponse {
  amount: number;
  timeBasis: DeductionTimeBasisResponse;
}

export interface DeductionBasisReferenceReponse {
  key: DeductionTargetBasis;
  label: string;
}
