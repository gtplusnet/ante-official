// Workflow related interfaces

export interface IWorkflowTransition {
  id: number;
  fromStageId: number;
  toStageId: number;
  type?: string;
  buttonName?: string;
  buttonLabel?: string;
  buttonColor?: string;
  buttonIcon?: string;
  dialogType?: string;
  confirmationRequired?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  requireRemarks?: boolean;
}

export interface IWorkflowStage {
  id: number;
  workflowId: number;
  name: string;
  key: string;
  color: string;
  textColor: string;
  sequence: number;
  isInitial: boolean;
  isFinal: boolean;
  transitionsFrom?: IWorkflowTransition[];
  transitionsTo?: IWorkflowTransition[];
}

export interface IWorkflowTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  stages?: IWorkflowStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IWorkflowInstance {
  id: number;
  workflowId: number;
  sourceModule: string;
  sourceId: string | number;
  currentStageId: number;
  metadata?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  workflow?: IWorkflowTemplate;
  currentStage?: IWorkflowStage;
}

export interface IWorkflowTask {
  id: number;
  instanceId: number;
  taskId: number;
  stageId: number;
  instance?: IWorkflowInstance;
  stage?: IWorkflowStage;
  createdAt?: string;
  updatedAt?: string;
}

export interface IWorkflowActionEvent {
  transition?: IWorkflowTransition;
  newStage?: IWorkflowStage;
  remarks?: string;
  success: boolean;
  message?: string;
}

// Props interface for WorkflowDetails component
export interface IWorkflowDetailsProps {
  taskInformation: {
    id: number;
    workflowInstanceId?: number | null;
    WorkflowTask?: IWorkflowTask | null;
    approvalMetadata?: {
      sourceModule: string;
      sourceId: string | number;
    };
  };
}