export interface SentEmailResponse {
  readonly id: string;
  readonly companyId: number;
  readonly sentBy?: string;
  readonly sentByAccount?: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
  };
  readonly sentAt: string;
  readonly module: string;
  readonly moduleContext?: string;
  readonly to: string[];
  readonly cc?: string[];
  readonly bcc?: string[];
  readonly subject: string;
  readonly htmlContent?: string;
  readonly textContent?: string;
  readonly status: string;
  readonly errorMessage?: string;
  readonly messageId?: string;
  readonly metadata?: Record<string, any>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListSentEmailsResponse {
  readonly emails: SentEmailResponse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface SentEmailStatsResponse {
  readonly totalEmails: number;
  readonly successfulEmails: number;
  readonly failedEmails: number;
  readonly pendingEmails: number;
  readonly moduleStats: Array<{
    readonly module: string;
    readonly count: number;
    readonly successRate: number;
  }>;
  readonly recentActivity: Array<{
    readonly date: string;
    readonly count: number;
  }>;
}
