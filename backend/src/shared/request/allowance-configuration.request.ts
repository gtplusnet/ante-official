import { AllowanceType } from '@prisma/client';

export interface CreateAllowanceConfigurationRequest {
  name: string;
  allowanceCategory: AllowanceType;
  parentDeductionId?: number;
}

export interface UpdateAllowanceConfigurationRequest
  extends CreateAllowanceConfigurationRequest {
  id: number;
}
