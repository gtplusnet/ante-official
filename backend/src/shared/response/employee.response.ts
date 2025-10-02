import { AccountDataResponse } from './account.response';
import { ContractDataResponse } from './contract.response';
import { PayrollGroupDataResponse } from './payroll-group.response';
import { ScheduleDataResponse } from './schedule.response';
import { BranchDataResponse } from './branch.response';

export interface JobDetailsResponse {
  bankName: string | null;
  bankAccountNumber: string | null;
  biometricsNumber: string | null;
}

export interface GovernmentDetailsResponse {
  tinNumber: string | null;
  sssNumber: string | null;
  hdmfNumber: string | null;
  phicNumber: string | null;
}

export interface EmployeeDataResponse {
  employeeCode: string;
  accountDetails: AccountDataResponse;
  contractDetails: ContractDataResponse;
  payrollGroup: PayrollGroupDataResponse;
  schedule: ScheduleDataResponse;
  branch: BranchDataResponse;
  jobDetails?: JobDetailsResponse;
  governmentDetails?: GovernmentDetailsResponse;
}
