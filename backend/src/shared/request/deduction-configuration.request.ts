import { DeductionCategory, DeductionPeriod } from '@prisma/client';

export interface CreateDeductionConfigurationRequest {
  name: string;
  deductionCategory: DeductionCategory;
  parentDeduction?: number;
}

export interface UpdateDeductionConfigurationRequest
  extends CreateDeductionConfigurationRequest {
  id: number;
}

export interface CreateDeductionPlanConfigurationRequest {
  employeeAccountId: string;
  loanAmount: number;
  monthlyAmortization: number;
  deductionConfigurationId: number;
  deductionPeriod: DeductionPeriod;
  effectivityDate: string;
}

export interface UpdateDeductionPlanConfigurationRequest
  extends CreateDeductionPlanConfigurationRequest {
  id: number;
}

export { DeductionPeriod };

export interface AddDeductionPlanBalanceRequest {
  deductionPlanId: number;
  amount: number;
  remarks: string;
}

export interface PayDeductionPlanBalanceRequest {
  deductionPlanId: number;
  amount: number;
  remarks: string;
}
