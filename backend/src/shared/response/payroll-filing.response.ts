import { DateFormat } from './utility.format';

export interface PayrollFilingTypeReferenceResponse {
  key: string;
  label: string;
}

export interface PayrollFilingStatusReferenceResponse {
  key: string;
  label: string;
}

export interface FileResponse {
  id: number;
  name: string;
  url: string;
  mimetype: string;
  size: number;
  originalName: string;
}

export interface PayrollFilingDataResponse {
  id: number;
  filingType: PayrollFilingTypeReferenceResponse;
  status: PayrollFilingStatusReferenceResponse;
  accountId: string;
  timeIn?: DateFormat;
  timeOut?: DateFormat;
  date?: DateFormat;
  hours?: number;
  isApproved: boolean;
  approvedById?: string;
  approvedAt?: DateFormat;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  remarks?: string;
  fileId?: number;
  file?: FileResponse;
}
