import { DeductionCategory } from '@prisma/client';
import { CurrencyFormat, DateFormat } from './utility.format';
import { AccountDataResponse } from './account.response';
import { WalletCodeReferenceResponse } from './wallet.response';
import { DeductionPeriodReferenceResponse } from './payroll-group.response';

export { DeductionCategory };

export interface DeductionConfigurationDataResponse {
  id: number;
  name: string;
  category: DeductionCategoryDataResponse;
  isParentDeduction: boolean;
  childDeduction: DeductionConfigurationDataResponse[];
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface DeductionCategoryDataResponse {
  key: DeductionCategory;
  value: string;
  hasTotalAmount: boolean;
}

export interface DeductionPlanConfigurationDataResponse {
  id: number;
  planCode: string;
  employeeCode: string;
  accountInformation: AccountDataResponse;
  deductionConfiguration: DeductionConfigurationDataResponse;
  monthlyAmortization: CurrencyFormat;
  totalPaidAmount: CurrencyFormat;
  totalAmount: CurrencyFormat;
  remainingBalance: CurrencyFormat;
  isOpen: boolean;
  deductionPeriod: DeductionPeriodReferenceResponse;
  displayBalance: string;
  effectivityDate: DateFormat;
  isActive: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface DeductionPlanHistoryDataResponse {
  id: number;
  amount: CurrencyFormat;
  transactionCode: WalletCodeReferenceResponse;
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
