import { SalaryAdjustmentType } from '@prisma/client';

export interface CreateEmployeeSalaryAdjustmentDTO {
  accountId: string;
  cutoffDateRangeId: string;
  adjustmentType: SalaryAdjustmentType;
  configurationId: number;
  title: string;
  amount: number;
}

export interface UpdateEmployeeSalaryAdjustmentDTO {
  id: number;
  amount?: number;
  isActive?: boolean;
}

export interface GetEmployeeSalaryAdjustmentsDTO {
  accountId?: string;
  cutoffDateRangeId?: string;
  adjustmentType?: SalaryAdjustmentType;
  isActive?: boolean;
}
