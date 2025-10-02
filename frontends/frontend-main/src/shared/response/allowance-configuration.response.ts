import { AllowanceType, TaxBasis } from '@/types/prisma-enums';
import { DateFormat } from './utility.format';

export interface AllowanceCategoryDataResponse {
  key: AllowanceType;
  value: string;
}

export interface TaxBasisDataResponse {
  key: TaxBasis;
  value: string;
}

export interface AllowanceConfigurationDataResponse {
  id: number;
  name: string;
  category: AllowanceCategoryDataResponse;
  taxBasis: TaxBasis;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface AllowanceTreeResponse extends AllowanceCategoryDataResponse {
  children: AllowanceConfigurationDataResponse[];
}
