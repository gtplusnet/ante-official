export interface FilingDisplayData {
  id: number;
  filingType?: { label: string };
  account?: { firstName: string; lastName: string };
  accountId?: string | number;
  date: string | Date;
  timeIn?: string | Date;
  timeOut?: string | Date;
  hours?: number;
  remarks?: string;
  rejectReason?: string;
  file?: { id?: number; name: string; url?: string };
  fileId?: number;
  status?: string | { key: string; label: string };
  createdAt?: string | Date;
  shiftId?: number;
  // Additional fields for specific filing types
  originalTimeIn?: string | Date;
  originalTimeOut?: string | Date;
  adjustmentType?: string;
  destination?: string;
  purpose?: string;
  eventName?: string;
  venue?: string;
  certificatePurpose?: string;
  requestorName?: string;
  fileName?: string;
  // Leave-specific data
  leaveData?: {
    compensationType?: string;
    leaveType?: string;
    leaveId?: number;
    employeeLeavePlanId?: number;
    days?: number;
    creditsBefore?: string;
    creditsAfter?: string;
  };
  // Approval information
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string | Date;
}

export interface FilingNotificationPayload {
  type: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  filing: {
    filingId: number;
    filingType: string;
    filingTypeLabel: string;
    requestorId: string;
    requestorName: string;
    requestorEmail: string;
    date: string;
    timeIn?: string;
    timeOut?: string;
    hours?: number;
    remarks?: string;
    rejectReason?: string;
    fileId?: number;
    fileName?: string;
    status: string;
    approvedAt?: string;
    approvedBy?: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
    shiftId?: number;
  };
  message: string;
  notificationCode: string;
}

export interface NotificationDataSource {
  type: 'task' | 'payload';
  data: FilingNotificationPayload | TaskDataInterface;
}

// Task-like object interface for compatibility
export interface TaskDataInterface {
  id?: number | null;
  approvalMetadata?: {
    sourceModule?: string;
    sourceId?: string;
    sourceData?: Record<string, unknown>;
    approvedAt?: string;
    remarks?: string;
  };
  boardLane?: {
    key?: string;
  };
}