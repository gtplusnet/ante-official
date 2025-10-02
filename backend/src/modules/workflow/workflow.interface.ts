import {
  WorkflowTemplate,
  WorkflowStage,
  WorkflowTransition,
  AssigneeType,
  Role,
} from '@prisma/client';

export interface WorkflowTemplateWithStages extends WorkflowTemplate {
  stages: WorkflowStageWithTransitions[];
}

export interface WorkflowStageWithTransitions extends WorkflowStage {
  transitionsFrom: WorkflowTransition[];
  transitionsTo: WorkflowTransition[];
  assignedRole?: Role | null;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface WorkflowStageWithAssigneeDetails
  extends WorkflowStageWithTransitions {
  assigneeDetails?: {
    type: AssigneeType;
    name: string;
    description: string;
    userCount?: number;
  };
}

export interface DialogOption {
  type: string;
  name: string;
  description: string;
  isCommon: boolean;
  supportsRejection: boolean;
  configSchema?: any;
}

export interface CreateWorkflowTemplateDto {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkflowTemplateDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateWorkflowStageDto {
  workflowId: number;
  name: string;
  key: string;
  description?: string;
  color: string;
  textColor: string;
  sequence: number;
  isInitial?: boolean;
  isFinal?: boolean;
  assigneeType?: AssigneeType;
  assigneeId?: string;
  position?: { x: number; y: number };
}

export interface UpdateWorkflowStageDto {
  name?: string;
  description?: string;
  color?: string;
  textColor?: string;
  sequence?: number;
  isInitial?: boolean;
  isFinal?: boolean;
  assigneeType?: AssigneeType;
  assigneeId?: string;
  position?: { x: number; y: number };
}

export interface CreateWorkflowTransitionDto {
  fromStageId: number;
  toStageId?: number;
  transitionType?: string;
  buttonName?: string;
  buttonColor?: string;
  dialogType?: string;
  customDialogConfig?: any;
  conditionType?: string;
  conditionData?: any;
  fromSide?: string;
  toSide?: string;
}

export interface ReorderStagesDto {
  stages: {
    id: number;
    sequence: number;
  }[];
}

export interface CloneWorkflowDto {
  sourceWorkflowId: number;
  name: string;
  code: string;
  description?: string;
}
