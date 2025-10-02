import {
  ActionCheckType,
  ActionIssueType,
} from './mongodb/account-action-mongo.schema';

export interface ActionCenterItem {
  id: string;
  accountId: string;
  employeeName: string;
  employeeCode?: string;
  checkType: ActionCheckType;
  issueType: ActionIssueType;
  priority: number;
  description: string;
  metadata?: Record<string, any>;
  isIgnored: boolean;
  ignoredBy?: string;
  ignoredAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  daysUntilExpiry?: number;
  daysSinceExpiry?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionCenterStats {
  totalActive: number;
  byPriority: Record<number, number>;
  byCheckType: Record<string, number>;
  recentlyResolved: number;
}

export interface ActionCenterListParams {
  page?: number;
  limit?: number;
  checkType?: ActionCheckType;
  priority?: number;
  isIgnored?: boolean;
  resolved?: boolean;
  search?: string;
}

export interface ActionCenterIgnoreDTO {
  accountId: string;
}

export interface ActionCenterResolveDTO {
  accountId: string;
  notes?: string;
}
