import { SSSComputationType } from '../../shared/enums/sss-computation-type.enums';
import { DateFormat } from './utility.format';

export interface SSSConfigDataResponse {
  dateStart: string;
  dateStartFormatted?: DateFormat;
  computationType: SSSComputationType;
  label: string;
  data: SSSDataResponse[];
}

export interface SSSDataResponse {
  compensationRange: number;
  compensationRangeLabel?: string;
  monthlySalaryCredit: {
    regular: number;
    mpf: number;
    total?: number;
  };
  contributionAmount: {
    employer: {
      regular: number;
      mpf: number;
      ec: number;
      total?: number;
    };
    employee: {
      regular: number;
      mpf: number;
      total?: number;
    };
  };

  total?: number;
}
