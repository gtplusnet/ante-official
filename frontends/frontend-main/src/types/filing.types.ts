export interface FilingResponse {
  id: number;
  filingType: {
    key: string;
    label: string;
  };
  status: {
    key: string;
    label: string;
  };
  accountId: string;
  date?: string;
  timeIn?: string;
  timeOut?: string;
  hours?: number;
  nightDifferentialHours?: number;
  remarks?: string;
  shiftData?: {
    shiftType?: string;
    targetHours?: number;
    workingHours?: number;
    totalBreakHours?: number;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
}

// Add missing types for the shared package imports
export interface CreateFilingRequest {
  id?: number;
  type: string;
  accountId: number;
  date: string;
  reason?: string;
  remarks?: string;
  status?: string;
  hours?: number;
  nightDifferentialHours?: number;
  shiftData?: any;
  rejectReason?: string;
  [key: string]: any;
}

export interface UpdateFilingRequest extends CreateFilingRequest {
  id: number;
}

export interface Filing extends CreateFilingRequest {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}