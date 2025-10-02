import { AccountDataResponse } from './account.response';
import { DateFormat } from './utility.format';

export interface PayrollApproverDataResponse {
  id: number;
  account: AccountDataResponse;
  companyId: number;
  approvalLevel?: number;
  isActive?: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
