export interface AddPayrollApproverRequest {
  accountId: string;
  approvalLevel?: number;
}

export interface BulkAddPayrollApproverRequest {
  accountIds: string[];
  approvalLevel?: number;
}

export interface DeletePayrollApproverRequest {
  accountId: string;
}
