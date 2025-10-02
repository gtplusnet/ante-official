export interface FilingNotificationData {
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
  nightDifferentialHours?: number;
  remarks?: string;
  rejectReason?: string;
  fileId?: number;
  fileName?: string;
  status: string;
  approvedAt?: Date;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  shiftId?: number;
  approvalTaskId?: number;
}

export interface NotificationPayload {
  type: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'CANCELLED';
  filing: FilingNotificationData;
  message: string;
  notificationCode: string;
}

export interface FilingApprovalNotificationOptions {
  filing: any; // Prisma filing object with includes
  approverId?: string;
  remarks?: string;
}
