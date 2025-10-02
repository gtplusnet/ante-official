import { DateFormat } from './utility.format';

export interface TaskInterface {
  id: number;
  title: string;
  description: string;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  dueDate?: DateFormat;
  createdById: string;
  assignedToId?: string;
  boardLaneId: number;
  boardLane?: {
    id: number;
    name: string;
    description: string;
    key: string;
    order: number;
    isDefault: boolean;
    createdAt: DateFormat;
    updatedAt: DateFormat;
    isDeleted: boolean;
  };
  priorityLevel: number;
  projectId?: number;
  isDeleted: boolean;
  assignedByDifficultySet: number;
  assignedToDifficultySet: number;
  isRead: boolean;
  isOpen: boolean;
  isSelfAssigned: boolean;
  order: number;
  roleGroupId?: string;
  taskType?: 'NORMAL' | 'APPROVAL' | 'REVIEW' | 'NOTIFICATION';
}

export interface CombinedTaskResponseInterface extends TaskInterface {
  assignedTo?: any;
  createdBy?: any;
  boardLane?: any;
  project?: any;
  permissions?: any;
  isPastDue?: boolean;
  taskType?: 'NORMAL' | 'APPROVAL' | 'REVIEW' | 'NOTIFICATION';
  approvalMetadata?: {
    id: number;
    sourceModule: string;
    sourceId: string;
    actions: string[];
    approvalLevel: number;
    maxApprovalLevel: number;
    sourceData?: Record<string, any>;
  };
}

export interface TaskListResponseInterface<T> {
  items: T[];
  total: number;
  timestamp: DateFormat;
}

export interface TaskUserResponseInterface {
  id: string;
  email: string;
  name: string;
  taskCount: number;
  totalDifficultyBy: number;
  totalDifficultyTo: number;
}

export interface CollaboratorResponseInterface {
  id: string;
  email: string;
  name: string;
  watcherType: string;
}

export interface TaskCountByStatusResponseInterface {
  activeTaskCount: number;
  assignedTaskCount: number;
  completedTaskCount: number;
}
