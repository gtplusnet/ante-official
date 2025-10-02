import { Injectable, Inject } from '@nestjs/common';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import NotificationTypeReference from '../../../../reference/notification-type.reference';
import {
  FilingNotificationData,
  NotificationPayload,
  FilingApprovalNotificationOptions,
} from '../interfaces/filing-notification.interface';

@Injectable()
export class FilingNotificationService {
  @Inject() private notificationService: NotificationService;

  /**
   * Transform Prisma filing object to standardized notification data
   */
  private transformFilingData(filing: any): FilingNotificationData {
    return {
      filingId: filing.id,
      filingType: filing.filingType,
      filingTypeLabel: this.getFilingTypeLabel(filing.filingType),
      requestorId: filing.accountId,
      requestorName: `${filing.account.firstName} ${filing.account.lastName}`,
      requestorEmail: filing.account.email,
      date: filing.date ? filing.date.toISOString() : '',
      timeIn: filing.timeIn ? filing.timeIn.toISOString() : undefined,
      timeOut: filing.timeOut ? filing.timeOut.toISOString() : undefined,
      hours: filing.hours,
      nightDifferentialHours: filing.nightDifferentialHours,
      remarks: filing.remarks,
      rejectReason: filing.rejectReason,
      fileId: filing.file?.id,
      fileName: filing.file?.name,
      status: filing.status,
      approvedAt: filing.approvedAt,
      approvedBy: filing.approvedBy
        ? {
            id: filing.approvedBy.id,
            name: `${filing.approvedBy.firstName} ${filing.approvedBy.lastName}`,
            email: filing.approvedBy.email,
          }
        : undefined,
      createdAt: filing.createdAt,
      shiftId: filing.shift?.id,
      approvalTaskId: filing.approvalTaskId,
    };
  }

  /**
   * Send approval request notification (PENDING)
   */
  async sendApprovalRequest(
    options: FilingApprovalNotificationOptions,
  ): Promise<void> {
    const filingData = this.transformFilingData(options.filing);

    const payload: NotificationPayload = {
      type: 'PENDING',
      filing: filingData,
      message: `You have a filing approval request for ${filingData.filingTypeLabel}`,
      notificationCode: NotificationTypeReference.FILING_APPROVAL_PENDING.key,
    };

    // Send notification with task ID for approval action
    await this.notificationService.sendNotifications(
      null,
      options.filing.accountId, // Sender is the filing creator
      [options.approverId!], // Receiver is the approver
      payload.message,
      payload.notificationCode,
      options.filing.approvalTaskId
        ? options.filing.approvalTaskId.toString()
        : JSON.stringify(payload), // Use task ID if available
    );
  }

  /**
   * Send approval notification (APPROVED)
   */
  async sendApprovalApproved(
    options: FilingApprovalNotificationOptions,
  ): Promise<void> {
    const filingData = this.transformFilingData(options.filing);

    const payload: NotificationPayload = {
      type: 'APPROVED',
      filing: filingData,
      message: `Your ${filingData.filingTypeLabel} request has been approved`,
      notificationCode: NotificationTypeReference.FILING_APPROVAL_APPROVED.key,
    };

    await this.notificationService.sendNotifications(
      null,
      options.approverId!,
      [options.filing.accountId],
      payload.message,
      payload.notificationCode,
      JSON.stringify(payload),
    );
  }

  /**
   * Send rejection notification (REJECTED)
   */
  async sendApprovalRejected(
    options: FilingApprovalNotificationOptions,
  ): Promise<void> {
    const filingData = this.transformFilingData(options.filing);

    const payload: NotificationPayload = {
      type: 'REJECTED',
      filing: filingData,
      message: `Your ${filingData.filingTypeLabel} request has been rejected${options.remarks ? ': ' + options.remarks : ''}`,
      notificationCode: NotificationTypeReference.FILING_APPROVAL_REJECTED.key,
    };

    await this.notificationService.sendNotifications(
      null,
      options.approverId!,
      [options.filing.accountId],
      payload.message,
      payload.notificationCode,
      JSON.stringify(payload),
    );
  }

  /**
   * Send information request notification (INFO_REQUESTED)
   */
  async sendInfoRequested(
    options: FilingApprovalNotificationOptions,
  ): Promise<void> {
    const filingData = this.transformFilingData(options.filing);

    const payload: NotificationPayload = {
      type: 'INFO_REQUESTED',
      filing: filingData,
      message: `Additional information requested for your ${filingData.filingTypeLabel} request: ${options.remarks}`,
      notificationCode:
        NotificationTypeReference.FILING_APPROVAL_INFO_REQUESTED.key,
    };

    await this.notificationService.sendNotifications(
      null,
      options.approverId!,
      [options.filing.accountId],
      payload.message,
      payload.notificationCode,
      JSON.stringify(payload),
    );
  }

  /**
   * Send cancellation notification (CANCELLED)
   */
  async sendApprovalCancelled(
    options: FilingApprovalNotificationOptions,
  ): Promise<void> {
    const filingData = this.transformFilingData(options.filing);

    const payload: NotificationPayload = {
      type: 'CANCELLED',
      filing: filingData,
      message: `${filingData.requestorName} cancelled their ${filingData.filingTypeLabel} request`,
      notificationCode: NotificationTypeReference.FILING_APPROVAL_CANCELLED.key,
    };

    // Send notification to the approver
    await this.notificationService.sendNotifications(
      null,
      options.filing.accountId, // Sender is the filing creator
      [options.approverId!], // Receiver is the approver
      payload.message,
      payload.notificationCode,
      JSON.stringify(payload),
    );
  }

  /**
   * Get human-readable filing type label
   */
  public getFilingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      OFFICIAL_BUSINESS_FORM: 'Official Business',
      CERTIFICATE_OF_ATTENDANCE: 'Certificate of Attendance',
      OVERTIME: 'Overtime',
      SCHEDULE_ADJUSTMENT: 'Schedule Adjustment',
      LEAVE: 'Leave Request',
    };
    return labels[type] || type;
  }
}
