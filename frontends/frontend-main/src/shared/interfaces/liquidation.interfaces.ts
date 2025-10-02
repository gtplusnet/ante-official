// Liquidation related interfaces

export interface IAttachment {
  id: number;
  url: string;
  name?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
}

export interface IWorkflowStage {
  id: number;
  name: string;
  key: string;
  color: string;
  textColor: string;
  sequence?: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface IAmount {
  raw: number;
  formatCurrency: string;
}

export interface IDateObject {
  raw: string;
  date?: string;
  dateTime?: string;
}

export interface IStatus {
  key: string;
  text: string;
  color?: string;
}

export interface ILiquidation {
  id: number;
  amount: number | IAmount;
  vendorName?: string;
  vendorTin?: string;
  vendorAddress?: string;
  expenseCategory?: string;
  businessPurpose?: string;
  description?: string;
  receiptNumber?: string;
  receiptDate?: string | IDateObject;
  vatAmount?: number | IAmount;
  withholdingTaxAmount?: number | IAmount;
  isAiExtracted?: boolean;
  totalAIConfidence?: number;
  attachmentProof?: IAttachment;
  requestedBy?: IUser;
  workflowStage?: IWorkflowStage;
  status?: IStatus;
  createdAt?: string | IDateObject;
  updatedAt?: string | IDateObject;
}

// API Response interfaces
export interface ILiquidationTableResponse {
  list: ILiquidation[];
  total: number;
  page: number;
  perPage: number;
}

export interface ILiquidationFilter {
  field: string;
  operator: string;
  value: any;
}

export interface ILiquidationTableRequest {
  page: number;
  perPage: number;
  filters?: ILiquidationFilter[];
  settings?: Record<string, any>;
  searchKeyword?: string;
  searchBy?: string;
}