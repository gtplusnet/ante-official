export interface EmailApprovalTokenResponse {
  id: string;
  token: string;
  isUsed: boolean;
  createdAt: string;
}

export interface EmailApprovalActionResponse {
  success: boolean;
  message: string;
  taskId?: number;
  sourceModule?: string;
}

export interface EmailTemplateRenderResponse {
  subject: string;
  htmlContent: string;
  templateName: string;
}

export interface TokenValidationResponse {
  isValid: boolean;
  taskId?: number;
  approverId?: string;
  sourceModule?: string;
  sourceId?: string;
  action?: string;
  isUsed?: boolean;
  errorMessage?: string;
}
