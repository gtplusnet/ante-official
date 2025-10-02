import { PayrollFilingType } from '@prisma/client';

export interface CreatePayrollFilingRequest {
  accountId: string;
  filingType: PayrollFilingType;
  timeIn?: Date;
  timeOut?: Date;
  date?: Date;
  hours?: number;
  fileId?: number;
  reason?: string;
}

export interface UpdatePayrollFilingRequest extends CreatePayrollFilingRequest {
  id: number;
  isApproved?: boolean;
  approvedById?: string;
  approvedAt?: Date;
  status?: string;
  remarks?: string;
  fileId?: number;
}

export interface FilingActionRequest {
  id: number;
  remarks?: string; // required for reject
}
