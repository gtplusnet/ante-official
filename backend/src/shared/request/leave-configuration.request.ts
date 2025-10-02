export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
}

export interface UpdateLeaveTypeRequest {
  name?: string;
  code?: string;
  description?: string;
}

export interface CreateLeavePlanRequest {
  leaveTypeConfigurationId: number;
  planName: string;
  canCarryOver: boolean;
  maxCarryOverCredits?: number;
  canConvertToCash: boolean;
  maxCashConversionCredits?: number;
  canFileSameDay: boolean;
  allowLateFiling: boolean;
  advanceFilingDays?: number;
  maxConsecutiveDays?: number;
  canFileAgainstFutureCredits: boolean;
  maxAdvanceFilingDays?: number;
  isAttachmentMandatory: boolean;
  isLimitedConsecutiveFilingDays: boolean;
  consecutiveFilingDays?: number;
  renewalType:
    | 'HIRING_ANNIVERSARY'
    | 'START_OF_YEAR'
    | 'MONTHLY'
    | 'CUSTOM_DATE';
  customRenewalDate?: string; // Only required when renewalType is CUSTOM_DATE
}

export interface UpdateLeavePlanRequest
  extends Partial<CreateLeavePlanRequest> {}

export interface EmployeeAssignmentRequest {
  accountId: string;
  totalAnnualCredits: number;
  monthlyAccrualCredits: number;
  initialLeaveCredits: number;
  leaveCreditsGivenUpfront: number; // For renewal use
  monthDayCreditsAccrual?: number; // Only required when monthlyAccrualCredits > 0
  numberOfDaysOfMonth?: number;
  LeaveCreditsData?: {
    initialLeaveCredits: number;
    leaveCreditsGivenUpfront: number;
    monthlyAccrualCredits: number;
    numberOfDaysOfMonth: number;
  };
}

export interface AssignEmployeesToPlanRequest {
  leavePlanId: number | undefined;
  employees: EmployeeAssignmentRequest[];
}

export interface UpdateEmployeeCreditsRequest {
  currentCredits?: number;
  usedCredits?: number;
  carriedCredits?: number;
}

export interface AdjustEmployeeCreditsRequest {
  amount: number;
  reason: string;
  transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
}

export interface UpdateEmployeeLeaveSettingsRequest {
  totalAnnualCredits?: number;
  monthlyAccrualCredits?: number;
  monthDay?: number;
  leaveCreditsGivenUpfront?: number;
}

export interface BulkCreditAdjustmentRequest {
  adjustments: Array<{
    employeeLeavePlanId: number;
    amount: number;
    reason: string;
    transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
  }>;
}

export interface HistoryExportRequest {
  format?: 'excel';
  startDate?: string;
  endDate?: string;
}

export interface HistorySummaryRequest {
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeAllHistoryRequest {
  startDate?: string;
  endDate?: string;
  leavePlanId?: number;
}

export interface LeaveConfigFormData {
  planName: string;
  // Leave Credit Settings
  canCarryOver: boolean;
  maxCarryOverCredits?: number;
  canConvertToCash: boolean;
  maxCashConversionCredits?: number;
  // Request Filing Settings
  canFileSameDay: boolean;
  allowLateFiling: boolean;
  advanceFilingDays?: number;
  maxConsecutiveDays?: number;
  canFileAgainstFutureCredits: boolean;
  maxAdvanceFilingDays?: number;
  isAttachmentMandatory: boolean;
}
