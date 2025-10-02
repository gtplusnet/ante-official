export interface EmailApprovalConfig {
  templateName: string;
  dataMapper: (sourceData: any) => Record<string, any>;
  actions: string[];
  redirectUrls: {
    success: string;
    rejection: string;
    error?: string;
  };
}

export interface TokenData {
  taskId: number;
  approverId: string;
  sourceModule: string;
  sourceId: string;
  action: string;
  timestamp: number;
  nonce: string;
}

export interface EmailApprovalContext {
  taskId: number;
  approverId: string;
  approverName: string;
  approverEmail: string;
  sourceModule: string;
  sourceId: string;
  templateName: string;
  approvalData: Record<string, any>;
  baseUrl: string;
  companyName: string;
}
