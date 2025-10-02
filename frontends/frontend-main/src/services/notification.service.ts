import bus from 'src/bus';
import { api } from 'src/boot/axios';
import { FilingDataResolver } from './filing-data-resolver.service';
import { NotificationResponse } from '@shared/response';
import { CombinedTaskResponseInterface } from '../shared/interfaces/task.interfaces';
import { DiscussionProps } from '../components/shared/discussion/DiscussionProps';
import { FilingNotificationPayload, FilingDisplayData } from '../interfaces/filing-notification.interface';
import { Loading } from 'quasar';

export class NotificationService {
  /**
   * Handle notification click by routing to appropriate dialog
   */
  static async handleNotificationClick(data: NotificationResponse): Promise<void> {
    const showDialogId = data.notificationData.showDialogId;
    const showDialogModule = data.notificationData.showDialogModule;
    
    if (!showDialogId) return;
    
    Loading.show();
    
    try {
      switch (showDialogModule) {
        case 'task':
          await this.handleTaskNotification(showDialogId);
          break;
        case 'discussion':
          await this.handleDiscussionNotification(showDialogId);
          break;
        case 'filing_approval':
          await this.handleFilingApprovalNotification(showDialogId);
          break;
      }
    } finally {
      Loading.hide();
    }
  }
  
  /**
   * Handle task notifications
   */
  private static async handleTaskNotification(taskId: string | number): Promise<void> {
    const response = await api.get(`/task?id=${taskId}`);
    const task = response.data as CombinedTaskResponseInterface;
    
    // Check if this is an approval task for filing
    if (task?.taskType === 'APPROVAL' && task.approvalMetadata?.sourceModule === 'HR_FILING') {
      bus.emit('showFilingApprovalDialog', { task, filing: null });
    } else {
      bus.emit('showTaskDialog', task);
    }
  }
  
  /**
   * Handle discussion notifications
   */
  private static async handleDiscussionNotification(discussionId: string | number): Promise<void> {
    const response = await api.get(`/discussion/${discussionId}`);
    const discussionInformation = response.data;
    
    const discussionData: DiscussionProps = {
      discussionTitle: discussionInformation.title,
      discussionModule: discussionInformation.module,
      targetId: discussionInformation.targetId,
      fromNotification: true,
    };
    
    bus.emit('showDiscussionDialog', discussionData);
  }
  
  /**
   * Handle filing approval notifications (most complex)
   */
  private static async handleFilingApprovalNotification(filingIdOrTaskId: string): Promise<void> {
    // Try to parse as unified notification payload (new format)
    const parsedData = FilingDataResolver.parseNotificationData(filingIdOrTaskId);
    
    if (parsedData && parsedData.type === 'payload') {
      // New unified notification format - set filing data directly
      const payloadFiling = (parsedData.data as FilingNotificationPayload).filing;
      const filingData: FilingDisplayData = {
        id: payloadFiling.filingId,
        filingType: { label: payloadFiling.filingTypeLabel },
        account: {
          firstName: payloadFiling.requestorName.split(' ')[0] || '',
          lastName: payloadFiling.requestorName.split(' ').slice(1).join(' ') || '',
        },
        accountId: payloadFiling.requestorId,
        date: payloadFiling.date,
        timeIn: payloadFiling.timeIn,
        timeOut: payloadFiling.timeOut,
        hours: payloadFiling.hours,
        remarks: payloadFiling.remarks,
        rejectReason: payloadFiling.rejectReason,
        file: payloadFiling.fileName ? { id: payloadFiling.fileId, name: payloadFiling.fileName } : undefined,
        fileId: payloadFiling.fileId,
        status: payloadFiling.status,
        createdAt: payloadFiling.createdAt,
        requestorName: payloadFiling.requestorName,
        shiftId: payloadFiling.shiftId,
      };
      
      bus.emit('showFilingApprovalDialog', { task: null, filing: filingData });
    } else {
      // Legacy format - try to get as task first, then fallback to filing ID
      let task = null;
      
      try {
        const taskResponse = await api.get(`/task?id=${filingIdOrTaskId}`);
        if (taskResponse.data && taskResponse.data.taskType === 'APPROVAL' && taskResponse.data.approvalMetadata) {
          task = taskResponse.data;
        }
      } catch (taskError) {
        // Task lookup failed, treat as direct filing ID
      }
      
      if (task) {
        // This is an approval task notification
        bus.emit('showFilingApprovalDialog', { task, filing: null });
      } else {
        // Legacy direct filing ID notification
        const legacyTask = FilingDataResolver.createLegacyTaskObject(filingIdOrTaskId);
        bus.emit('showFilingApprovalDialog', { task: legacyTask, filing: null });
      }
    }
  }
  
  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notification/read?id=${notificationId}`);
  }
  
  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    await api.patch('/notification/read');
  }
  
  /**
   * Emit approval complete event
   */
  static emitApprovalComplete(): void {
    bus.emit('notificationApprovalComplete');
  }
}