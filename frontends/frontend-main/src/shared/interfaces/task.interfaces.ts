/**
 * Task interfaces - Re-export from backend shared types with frontend extensions
 * This file will be deprecated - use @shared/response directly
 */

// Import base task interfaces from backend shared types
import type {
  TaskInterface as BaseTaskInterface,
  CombinedTaskResponseInterface as BaseCombinedTaskResponseInterface,
  TaskListResponseInterface,
  TaskUserResponseInterface,
  CollaboratorResponseInterface,
  TaskCountByStatusResponseInterface,
  DateFormat
} from "@shared/response";

// Frontend-specific extensions to maintain compatibility with existing UI
export interface TaskInterface extends Omit<BaseTaskInterface, 'priorityLevel' | 'assignedByDifficultySet' | 'assignedToDifficultySet' | 'boardLane'> {
  priorityLevel: {
    label: string;
    color: string;
    textColor: string;
  };
  assignedByDifficultySet: {
    label: string;
    color: string;
    textColor: string;
  };
  assignedToDifficultySet: {
    label: string;
    color: string;
    textColor: string;
  };
  boardLane?: {
    id: number;
    name: string;
    description: string;
    key: {
      label: string;
      color: string;
      textColor: string;
    };
    order: number;
    isDefault: boolean;
    createdAt: DateFormat;
    updatedAt: DateFormat;
    isDeleted: boolean;
  };
}

export interface CombinedTaskResponseInterface extends Omit<BaseCombinedTaskResponseInterface, 'priorityLevel' | 'assignedByDifficultySet' | 'assignedToDifficultySet'> {
  priorityLevel: {
    label: string;
    color: string;
    textColor: string;
  };
  assignedByDifficultySet: {
    label: string;
    color: string;
    textColor: string;
  };
  assignedToDifficultySet: {
    label: string;
    color: string;
    textColor: string;
  };
  taskType?: 'NORMAL' | 'APPROVAL' | 'REVIEW' | 'NOTIFICATION';
  approvalMetadata?: {
    id: number;
    sourceModule: string;
    sourceId: string;
    actions: string[];
    approvalLevel: number;
    maxApprovalLevel: number;
    sourceData?: Record<string, unknown>;
  };
  tags?: Array<{
    id?: string | number;
    label: string;
    color: string;
    textColor?: string;
  }>;
  workflowInstanceId?: number | null;
  workflowTask?: {
    id: number;
    instanceId: number;
    taskId: number;
    stageId: number;
    instance?: any;
    stage?: any;
  } | null;
}

// Re-export the other interfaces unchanged
export type {
  TaskListResponseInterface,
  TaskUserResponseInterface,
  CollaboratorResponseInterface,
  TaskCountByStatusResponseInterface,
  DateFormat
};
