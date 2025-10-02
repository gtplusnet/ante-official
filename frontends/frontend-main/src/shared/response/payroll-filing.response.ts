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

// Add missing filing types expected by frontend
export interface FilingResponse extends PayrollFilingDataResponse {
  // Additional properties expected by frontend components
  timeAgo?: string;
  rejectReason?: string;
  shiftData?: ShiftData;
  leaveData?: LeaveData;
  nightDifferentialHours?: number;
}

export interface FilingsListResponse {
  data: FilingResponse[];
  total: number;
  page: number;
  limit: number;
}

// Aliases for type references
export type FilingTypeReference = PayrollFilingTypeReferenceResponse;
export type FilingStatusReference = PayrollFilingStatusReferenceResponse;

// Working hours and shift data types
export interface WorkingHour {
  startTime: string;
  endTime: string;
  breakDuration?: number;
  totalHours: number;
  isBreakTime?: boolean;
}

export interface ShiftData {
  id: number;
  shiftCode: string;
  startTime: string;
  endTime: string;
  workingHours: WorkingHour[];
  isNightShift: boolean;
  totalWorkHours: number;
  shiftType?: string;
}

export interface LeaveData {
  id: number;
  leaveType: string;
  startDate: DateFormat;
  endDate: DateFormat;
  totalDays: number;
  reason?: string;
  status: string;
}
