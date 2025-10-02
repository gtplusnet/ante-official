export interface ListSentEmailsRequest {
  readonly page?: number;
  readonly limit?: number;
  readonly module?: string;
  readonly status?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string; // Search in recipient or subject
  readonly sortBy?: 'sentAt' | 'module' | 'status';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface EmailMetadata {
  readonly module: string; // e.g., "PAYROLL", "HR_FILING"
  readonly moduleContext?: string; // e.g., "APPROVAL_REQUEST"
  readonly metadata?: Record<string, any>; // Additional module-specific data
}

export interface SaveSentEmailRequest {
  readonly companyId: number;
  readonly sentBy?: string;
  readonly module: string;
  readonly moduleContext?: string;
  readonly to: string | string[];
  readonly cc?: string | string[];
  readonly bcc?: string | string[];
  readonly subject: string;
  readonly htmlContent?: string;
  readonly textContent?: string;
  readonly status: 'SENT' | 'FAILED' | 'PENDING';
  readonly errorMessage?: string;
  readonly messageId?: string;
  readonly metadata?: Record<string, any>;
}
