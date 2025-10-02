export interface LeaveTypeStatus {
  isActive: boolean;
  label: string;
  badge: 'success' | 'warning' | 'danger';
}

import { DateFormat } from '@shared/response';

export interface LeaveTypeDates {
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface LeaveTypeStatistics {
  totalPlans: number;
  activePlans: number;
  totalEmployees: number;
  activeEmployees: number;
}

export interface FormattedLeavePlan {
  id: number;
  planName: string;
  isActive: boolean;
  employeeCount: number;
}

export interface LeaveTypeResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parentId: number | null;
  status: LeaveTypeStatus;
  dates: LeaveTypeDates;
  statistics: LeaveTypeStatistics;
  leavePlans?: FormattedLeavePlan[];
}

export interface LeaveTypeTreeResponse extends LeaveTypeResponse {
  children?: LeaveTypeTreeResponse[];
}

export interface LeaveTypeListResponse {
  leaveTypes: LeaveTypeResponse[];
  total: number;
  metadata: {
    activeCount: number;
    inactiveCount: number;
    totalPlans: number;
    totalEmployees: number;
  };
}
