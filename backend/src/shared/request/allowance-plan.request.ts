import { DeductionPeriod } from '@prisma/client';

export interface CreateAllowancePlanRequest {
  employeeAccountId: string;
  amount: number;
  effectivityDate: string;
  allowanceConfigurationId: number;
  deductionPeriod: DeductionPeriod;
}

export interface UpdateAllowancePlanRequest extends CreateAllowancePlanRequest {
  id: number;
}

export interface AddAllowancePlanBalanceRequest {
  allowancePlanId: number;
  amount: number;
  remarks: string;
}

export interface PayAllowancePlanBalanceRequest {
  allowancePlanId: number;
  amount: number;
  remarks: string;
}
