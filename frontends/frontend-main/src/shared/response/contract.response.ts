import { CurrencyFormat, DateFormat } from '.';
import { FileDataResponse } from './file.response';

export interface EmploymentStatusReference {
  key: string;
  label: string;
}

export interface ContractDataResponse {
  id: number;
  accountId: string;
  startDate: DateFormat;
  endDate: DateFormat;
  employmentStatus: EmploymentStatusReference;
  monthlyRate: CurrencyFormat;
  contractFileId: number;
  contractFile: FileDataResponse | null;
  isActive: boolean;
  isEmployeeActiveContract: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
