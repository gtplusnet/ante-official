import { api } from 'src/boot/axios';
import { FilingDisplayData, FilingNotificationPayload, NotificationDataSource, TaskDataInterface } from 'src/interfaces/filing-notification.interface';

export class FilingDataResolver {
  /**
   * Resolve filing data from any notification source
   * @param source - The notification data source (task or payload)
   * @returns Promise<FilingDisplayData | null>
   */
  static async resolveFilingData(source: NotificationDataSource): Promise<FilingDisplayData | null> {
    try {
      if (source.type === 'payload') {
        // New unified notification format with complete filing data
        return this.transformPayloadToDisplayData(source.data as FilingNotificationPayload);
      } else if (source.type === 'task') {
        // Legacy task-based notifications or approval task notifications
        return await this.resolveFromTask(source.data as TaskDataInterface);
      }
      return null;
    } catch (error) {
      console.error('Failed to resolve filing data:', error);
      return null;
    }
  }

  /**
   * Transform unified notification payload to display data
   */
  private static transformPayloadToDisplayData(payload: FilingNotificationPayload): FilingDisplayData {
    const filing = payload.filing;
    
    return {
      id: filing.filingId,
      filingType: { label: filing.filingTypeLabel },
      account: {
        firstName: filing.requestorName.split(' ')[0] || '',
        lastName: filing.requestorName.split(' ').slice(1).join(' ') || ''
      },
      accountId: filing.requestorId,
      date: filing.date,
      timeIn: filing.timeIn,
      timeOut: filing.timeOut,
      hours: filing.hours,
      remarks: filing.remarks,
      rejectReason: filing.rejectReason,
      file: filing.fileName ? { id: filing.fileId, name: filing.fileName } : undefined,
      fileId: filing.fileId,
      status: filing.status,
      createdAt: filing.createdAt,
      shiftId: filing.shiftId,
      requestorName: filing.requestorName,
    };
  }

  /**
   * Resolve filing data from legacy task-based notifications
   */
  private static async resolveFromTask(task: TaskDataInterface): Promise<FilingDisplayData | null> {
    if (!task || !task.approvalMetadata) {
      return null;
    }

    const metadata = task.approvalMetadata;

    // Always fetch fresh filing data to ensure we have all fields including shiftId
    if (metadata.sourceId && metadata.sourceModule === 'HR_FILING') {
      try {
        const response = await api.get(`/hr-filing/filing?id=${metadata.sourceId}`);
        return this.transformApiResponseToDisplayData(response.data);
      } catch (error) {
        console.error('Failed to fetch filing data:', error);
        // Fallback to sourceData if API call fails
        if (metadata.sourceData && metadata.sourceData.filingType) {
          return this.transformSourceDataToDisplayData(task, metadata.sourceData);
        }
        return null;
      }
    }
    
    // Fallback to sourceData if no sourceId
    if (metadata.sourceData && metadata.sourceData.filingType) {
      return this.transformSourceDataToDisplayData(task, metadata.sourceData);
    }

    return null;
  }

  /**
   * Transform task sourceData to display data
   */
  private static transformSourceDataToDisplayData(task: TaskDataInterface, sourceData: Record<string, unknown>): FilingDisplayData {
    // Prioritize actual status from sourceData if available, otherwise derive from task metadata
    let status = 'PENDING';
    
    if (sourceData.status && typeof sourceData.status === 'string') {
      // Use the actual filing status from backend
      status = sourceData.status as string;
    } else {
      // Fallback: derive status from task metadata (for legacy notifications)
      const metadata = task.approvalMetadata;
      
      if (metadata?.approvedAt) {
        const remarks = (metadata.remarks as string)?.toLowerCase() || '';
        status = remarks.includes('reject') ? 'REJECTED' : 'APPROVED';
      } else if (task.boardLane?.key === 'DONE') {
        status = 'APPROVED';
      }
    }

    return {
      id: sourceData.filingId as number,
      filingType: { label: sourceData.filingTypeLabel as string },
      account: {
        firstName: (sourceData.requestorName as string)?.split(' ')[0] || '',
        lastName: (sourceData.requestorName as string)?.split(' ').slice(1).join(' ') || ''
      },
      accountId: sourceData.requestorId as string,
      date: (sourceData.date as string) || (sourceData.timeIn as string) || new Date().toISOString(),
      timeIn: sourceData.timeIn as string | undefined,
      timeOut: sourceData.timeOut as string | undefined,
      hours: sourceData.hours as number | undefined,
      remarks: sourceData.remarks as string | undefined,
      rejectReason: sourceData.rejectReason as string | undefined,
      file: sourceData.fileId ? { id: sourceData.fileId as number, name: sourceData.fileName as string || 'Attachment' } : undefined,
      fileId: sourceData.fileId as number | undefined,
      status: status,
      // Additional fields from backend
      originalTimeIn: sourceData.originalTimeIn as string | undefined,
      originalTimeOut: sourceData.originalTimeOut as string | undefined,
      adjustmentType: sourceData.adjustmentType as string | undefined,
      destination: sourceData.destination as string | undefined,
      purpose: sourceData.purpose as string | undefined,
      eventName: sourceData.eventName as string | undefined,
      venue: sourceData.venue as string | undefined,
      certificatePurpose: sourceData.certificatePurpose as string | undefined,
      requestorName: sourceData.requestorName as string,
      fileName: sourceData.fileName as string | undefined,
    };
  }

  /**
   * Transform API response to display data
   */
  private static transformApiResponseToDisplayData(filing: Record<string, unknown>): FilingDisplayData {
    // Handle status object from API response - extract the key if it's an object
    let status = 'PENDING';
    if (filing.status) {
      if (typeof filing.status === 'string') {
        status = filing.status as string;
      } else if (typeof filing.status === 'object' && filing.status !== null) {
        // API returns status as {key: "APPROVED", label: "Approved"} - extract the key
        const statusObj = filing.status as Record<string, unknown>;
        status = (statusObj.key as string) || 'PENDING';
      }
    }

    // Construct requestor name from account object
    let requestorName = '';
    if (filing.account && typeof filing.account === 'object') {
      const account = filing.account as Record<string, unknown>;
      const firstName = account.firstName as string || '';
      const lastName = account.lastName as string || '';
      requestorName = `${firstName} ${lastName}`.trim();
    }

    return {
      id: filing.id as number,
      filingType: filing.filingType ? { label: (filing.filingType as Record<string, unknown>).label as string } : undefined,
      account: filing.account ? {
        firstName: (filing.account as Record<string, unknown>).firstName as string,
        lastName: (filing.account as Record<string, unknown>).lastName as string
      } : undefined,
      accountId: filing.accountId as string,
      date: filing.date as string,
      timeIn: filing.timeIn as string,
      timeOut: filing.timeOut as string,
      hours: filing.hours as number,
      remarks: filing.remarks as string,
      rejectReason: filing.rejectReason as string,
      file: filing.file ? { 
        id: (filing.file as Record<string, unknown>).id as number,
        name: (filing.file as Record<string, unknown>).name as string,
        url: (filing.file as Record<string, unknown>).url as string
      } : undefined,
      fileId: filing.fileId as number | undefined,
      status: status,
      createdAt: filing.createdAt as string,
      shiftId: filing.shiftId as number | undefined,
      requestorName: requestorName,
    };
  }

  /**
   * Determine the notification data source type and extract data
   */
  static parseNotificationData(showDialogId: string): NotificationDataSource | null {
    try {
      // Try to parse as JSON payload first (new unified format)
      const payload = JSON.parse(showDialogId) as FilingNotificationPayload;
      if (payload.type && payload.filing) {
        return { type: 'payload', data: payload };
      }
    } catch {
      // Not JSON, could be a task ID or filing ID (legacy format)
      // Return null to indicate we need to handle this differently
    }
    return null;
  }

  /**
   * Create a task-like object for legacy handling
   */
  static createLegacyTaskObject(filingId: string): TaskDataInterface {
    return {
      id: null,
      approvalMetadata: {
        sourceModule: 'HR_FILING',
        sourceId: filingId,
      },
    };
  }
}