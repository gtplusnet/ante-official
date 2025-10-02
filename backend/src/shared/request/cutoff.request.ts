import { CutoffType } from '@prisma/client';
import { CutoffConfigMonthly } from '../response';
import { CutoffConfigWeekly } from '../response';
import { CutoffConfigSemiMonthly } from '../response';

export interface CutoffDataRequest {
  id?: number;
  cutoffCode: string;
  cutoffType: CutoffType;
  cutoffConfig:
    | CutoffConfigMonthly
    | CutoffConfigWeekly
    | CutoffConfigSemiMonthly;
  releaseProcessingDays: number;
}

export interface CutoffTypeReferenceResponse {
  key: CutoffType;
  label: string;
}
