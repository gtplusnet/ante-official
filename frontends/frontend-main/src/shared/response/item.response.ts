import { CurrencyFormat, DateFormat } from './utility.format';

export interface ItemDataResponse {}

export interface ItemSimpleDataResponse {}

export interface ItemAdvanceDataResponse {
  id: string;
  name: string;
  sku: string;
  variantCombination: string;
  description: string;
  estimatedBuyingPrice: string;
  formattedEstimatedBuyingPrice: CurrencyFormat;
  size: string;
  parent: null | ItemSimpleDataResponse;
  isVariation: boolean;
  isDeleted: boolean;
  isDraft: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  tags: string[];
}
