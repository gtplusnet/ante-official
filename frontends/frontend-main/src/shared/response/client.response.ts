import { CurrencyFormat, DateFormat } from './utility.format';

export interface ClientDataResponse {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  totalCollection: CurrencyFormat;
  totalCollectionBalance: CurrencyFormat;
  totalCollected: CurrencyFormat;
  isDeleted: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
