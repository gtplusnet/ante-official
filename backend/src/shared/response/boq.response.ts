import { DateFormat } from './utility.format';

export interface BOQDataResponse {
  id: number;
  subject: string;
  contractId: string;
  expirationDate: DateFormat;
}
