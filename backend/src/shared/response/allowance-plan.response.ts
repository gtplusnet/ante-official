import { CurrencyFormat, DateFormat } from './utility.format';
import { AccountDataResponse } from './account.response';
import { AllowanceConfigurationDataResponse } from './allowance-configuration.response';
import { DeductionPeriodReferenceResponse } from './payroll-group.response';

export interface AllowancePlanDataResponse {
  id: number;
  planCode: string;
  employeeCode: string;
  accountInformation: AccountDataResponse;
  allowanceConfiguration: AllowanceConfigurationDataResponse;
  amount: CurrencyFormat;
  remainingBalance: CurrencyFormat;
  isActive: boolean;
  effectivityDate: DateFormat;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  deductionPeriod: DeductionPeriodReferenceResponse;
}

export interface AllowancePlanHistoryDataResponse {
  id: number;
  amount: CurrencyFormat;
  transactionCode: any; // You can refine this if you have a WalletCodeReferenceResponse
  remarks: string;
  beforeBalance: CurrencyFormat;
  afterBalance: CurrencyFormat;
  createdAt: DateFormat;
  cutoffDateRange?: {
    id: string;
    startDate: DateFormat;
    endDate: DateFormat;
    status: string;
    processingDate: DateFormat;
  } | null;
}
