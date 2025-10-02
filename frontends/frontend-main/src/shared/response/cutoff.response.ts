import { CutoffType } from '@/types/prisma-enums';
export interface CutoffDataResponse {
  id: number;
  cutoffCode: string;
  cutoffType: CutoffType;
  cutoffConfig: CutoffConfigMonthly | CutoffConfigWeekly | CutoffConfigSemiMonthly;
  releaseProcessingDays: number;
}

export { CutoffType } from '@/types/prisma-enums';
export enum DayCutoffPeriod {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export interface CutoffTypeReferenceResponse {
  key: CutoffType;
  divisor: number;
  label: string;
}

export interface CutoffConfigMonthly {
  cutoffPeriod: number;
}

export interface CutoffConfigWeekly {
  dayCutoffPeriod: DayCutoffPeriod;
}

export interface CutoffConfigSemiMonthly {
  firstCutoffPeriod: number;
  lastCutoffPeriod: number;
}
