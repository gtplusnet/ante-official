export interface LeavePlanCredits {
  totalUpfront: string;
  monthlyAccrual: string;
  maxCarryOver: string | null;
  maxCashConversion: string | null;
  formatted: {
    totalUpfront: string;
    monthlyAccrual: string;
    maxCarryOver: string | null;
    maxCashConversion: string | null;
  };
}

export interface LeavePlanRules {
  canCarryOver: boolean;
  canConvertToCash: boolean;
  canFileSameDay: boolean;
  allowLateFiling: boolean;
  canFileAgainstFutureCredits: boolean;
  isAttachmentMandatory: boolean;
  isLimitedConsecutiveFilingDays: boolean;
  maxConsecutiveDays: number | null;
  consecutiveFilingDays: number | null;
  advanceFilingDays: number | null;
  maxAdvanceFilingDays: number | null;
}

export interface LeavePlanRenewal {
  type: string;
  typeLabel: string;
  customDate: DateFormat | null;
}

export interface LeavePlanLeaveType {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

import { DateFormat } from '@shared/response';

export interface LeavePlanDates {
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface LeavePlanStatistics {
  totalEmployees: number;
  activeEmployees: number;
  totalCreditsAllocated: string;
  totalCreditsUsed: string;
  totalCreditsRemaining: string;
}

export interface LeavePlanResponse {
  id: number;
  planName: string;
  isActive: boolean;
  leaveType: LeavePlanLeaveType;
  credits: LeavePlanCredits;
  rules: LeavePlanRules;
  renewal: LeavePlanRenewal;
  dates: LeavePlanDates;
  statistics: LeavePlanStatistics;
}

export interface LeavePlanListResponse {
  leavePlans: LeavePlanResponse[];
  total: number;
  metadata: {
    activeCount: number;
    inactiveCount: number;
    totalEmployees: number;
    totalCreditsAllocated: string;
  };
}
