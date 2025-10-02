export interface EmployeeCredits {
  current: string;
  used: string;
  carried: string;
  remaining: string;
  total: string;
  totalAccumulated: string;
  formatted: {
    current: string;
    used: string;
    carried: string;
    remaining: string;
    total: string;
    totalAccumulated: string;
  };
}

export interface EmployeeLeaveInfo {
  accountId: string;
  employeeCode?: string;
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  role?: string;
  payrollGroup?: string;
  employmentStatus?: string;
  hireDate?: DateFormat | null;
}

import { DateFormat } from '@shared/response';

export interface EmployeeLeavePlanDates {
  effectiveDate: DateFormat;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface EmployeeLeavePlanStatus {
  isActive: boolean;
  label: string;
  badge: 'success' | 'warning' | 'danger';
}

export interface EmployeeLeavePlanPlan {
  id: number;
  planName: string;
  leaveType: {
    id: number;
    name: string;
    code: string;
  };
  monthlyAccrual: string;
  renewalType: string;
  rules: {
    canCarryOver: boolean;
    maxCarryOverCredits: number | null;
    canConvertToCash: boolean;
    maxCashConversionCredits: number | null;
    canFileSameDay: boolean;
    allowLateFiling: boolean;
    advanceFilingDays: number | null;
    maxConsecutiveDays: number | null;
    canFileAgainstFutureCredits: boolean;
    maxAdvanceFilingDays: number | null;
    isAttachmentMandatory: boolean;
    isLimitedConsecutiveFilingDays: boolean;
    consecutiveFilingDays: number | null;
  };
  customRenewalDate: DateFormat | null;
}

export interface EmployeeLeaveSettings {
  totalAnnualCredits: string;
  monthlyAccrualCredits: string;
  monthDayCreditsAccrual: number;
  leaveCreditsGivenUpfront: string;
  renewalType: string;
  customRenewalDate: DateFormat | null;
}

export interface EmployeeLeavePlanResponse {
  id: number;
  employee: EmployeeLeaveInfo;
  plan: EmployeeLeavePlanPlan;
  credits: EmployeeCredits;
  settings: EmployeeLeaveSettings;
  dates: EmployeeLeavePlanDates;
  status: EmployeeLeavePlanStatus;
}

export interface EmployeeLeavePlanListResponse {
  employeePlans: EmployeeLeavePlanResponse[];
  total: number;
  metadata: {
    activeCount: number;
    inactiveCount: number;
    totalCreditsAllocated: string;
    totalCreditsUsed: string;
    totalCreditsRemaining: string;
  };
}

export interface EmployeeAssignmentRequest {
  accountId: string;
  effectiveDate: Date | string;
  initialCredits?: number;
}

export interface EmployeeAssignmentResponse {
  leavePlanId: number;
  planName: string;
  leaveTypeName: string;
  assignedEmployees: EmployeeLeavePlanResponse[];
  summary: {
    totalAssigned: number;
    successfulAssignments: number;
    failedAssignments: number;
    totalCreditsAllocated: string;
  };
}

export interface EligibleEmployee {
  accountId: string;
  name: string;
  department: string;
  position: string;
  hireDate: DateFormat;
  currentAssignments: Array<{
    planName: string;
    leaveTypeName: string;
    isActive: boolean;
  }>;
  isEligible: boolean;
  ineligibilityReason?: string;
}

export interface LeaveCreditHistoryEntry {
  id: number;
  transactionType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  reason: string;
  referenceId?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: DateFormat;
}

export interface HistorySummaryResponse {
  employeeLeavePlan: {
    id: number;
    employee: EmployeeLeaveInfo;
    leavePlan: {
      planName: string;
      leaveType: string;
    };
    currentCredits: string;
  };
  summary: {
    totalTransactions: number;
    byTransactionType: Record<
      string,
      {
        count: number;
        totalAmount: string;
      }
    >;
    netChange: string;
    period: {
      startDate?: string;
      endDate?: string;
      year?: number;
    };
  };
  monthlyBreakdown?: Array<{
    month: string;
    credits: string;
    debits: string;
    netChange: string;
  }>;
}

export interface EmployeeAllHistoryResponse {
  employee: EmployeeLeaveInfo;
  leavePlans: Array<{
    leavePlanId: number;
    planName: string;
    leaveType: string;
    currentCredits: string;
    totalTransactions: number;
    history: LeaveCreditHistoryEntry[];
  }>;
  summary: {
    totalCreditsReceived: string;
    totalCreditsUsed: string;
    totalAdjustments: string;
    currentBalance: string;
  };
}

export interface BulkCreditAdjustmentResponse {
  leavePlanId: number;
  planName: string;
  processedAdjustments: number;
  failedAdjustments: number;
  results: Array<{
    employeeLeavePlanId: number;
    employeeName: string;
    success: boolean;
    newBalance?: string;
    historyId?: number;
    error?: string;
  }>;
  summary: {
    totalCreditsAdjusted: string;
    affectedEmployees: number;
  };
}
