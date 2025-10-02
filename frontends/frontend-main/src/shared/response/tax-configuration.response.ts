import { TaxComputationType } from '../enums/tax-computation-type.enums';

export interface TaxConfigDataResponse {
  dateStart: string;
  dateStartRaw?: Date;
  computationType: TaxComputationType;
  label: string;
  DAILY: TaxConfigDataValueResponse[];
  WEEKLY: TaxConfigDataValueResponse[];
  SEMIMONTHLY: TaxConfigDataValueResponse[];
  MONTHLY: TaxConfigDataValueResponse[];
}

export interface TaxConfigDataValueResponse {
  min: number;
  max: number;
  tax: number;
  percentage: number;
}

export interface TaxBracketResponse {
  bracket: TaxConfigDataValueResponse;
  taxOffset: number;
  taxFix: number;
  taxByPercentage: number;
  taxTotal: number;
}
