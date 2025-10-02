export interface SendEmailApprovalRequest {
  readonly taskId: number;
  readonly approverId: string;
  readonly module: string;
  readonly sourceId: string;
  readonly templateName: string;
  readonly approvalData: Record<string, any>;
  readonly recipientEmail: string;
  readonly attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface ProcessEmailApprovalRequest {
  readonly token: string;
  readonly action: string;
  readonly remarks?: string;
}

export interface EmailTemplateConfigRequest {
  readonly templateName: string;
  readonly dataMapper: (sourceData: any) => Record<string, any>;
  readonly actions: string[];
  readonly redirectUrls: {
    success: string;
    rejection: string;
    error?: string;
  };
}
