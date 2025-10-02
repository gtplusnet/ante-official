export interface LeaveTypeConfigurationResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: LeaveTypeConfigurationResponse;
  children?: LeaveTypeConfigurationResponse[];
  _count?: {
    leavePlans: number;
  };
}

export interface LeaveTypeTreeResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  children: LeaveTypeConfigurationResponse[];
  _count: {
    leavePlans: number;
  };
}

export interface LeavePlanResponse {
  id: number;
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
  totalUpfrontCredits: string;
  monthlyAccrualCredits: string;
  workingDaysPerMonth: number;
  renewalType: string;
  customRenewalDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leaveTypeConfiguration?: LeaveTypeConfigurationResponse;
  employeeLeavePlans?: EmployeeLeavePlanResponse[];
  _count?: {
    employeeLeavePlans: number;
  };
}

export interface EmployeeLeavePlanResponse {
  id: number;
  leavePlanId: number;
  accountId: string;
  effectiveDate: string;
  currentCredits: string;
  usedCredits: string;
  carriedCredits: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leavePlan?: LeavePlanResponse;
  employee?: {
    accountId: string;
    employeeCode: string;
    account: {
      id: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      email: string;
    };
    branch?: {
      id: number;
      name: string;
    };
  };
}

export interface EligibleEmployeeResponse {
  accountId: string;
  employeeCode: string;
  isActive: boolean;
  account: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    roleID: number;
    role: {
      id: number;
      name: string;
    };
  };
  branch: {
    id: number;
    name: string;
  };
  payrollGroup: {
    id: number;
    payrollGroupCode: string;
  };
}
