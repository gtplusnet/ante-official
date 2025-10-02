import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStageDto {
  @IsNumber()
  id: number;

  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  color: string;

  @IsString()
  textColor: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  isInitial: boolean;

  @IsBoolean()
  isFinal: boolean;

  @IsNumber()
  sequence: number;
}

export class WorkflowInstanceDto {
  @IsNumber()
  id: number;

  @IsString()
  sourceModule: string;

  @IsString()
  sourceId: string;

  @IsString()
  status: string;

  @IsNumber()
  currentStageId: number;

  @ValidateNested()
  @Type(() => WorkflowStageDto)
  @IsOptional()
  currentStage?: WorkflowStageDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class WorkflowTaskDto {
  @IsNumber()
  id: number;

  @IsNumber()
  instanceId: number;

  @IsNumber()
  stageId: number;

  @IsNumber()
  taskId: number;

  @ValidateNested()
  @Type(() => WorkflowInstanceDto)
  @IsOptional()
  instance?: WorkflowInstanceDto;

  @ValidateNested()
  @Type(() => WorkflowStageDto)
  @IsOptional()
  stage?: WorkflowStageDto;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

export class TaskWithWorkflowDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  taskType: string;

  @ValidateNested()
  @Type(() => WorkflowTaskDto)
  @IsOptional()
  WorkflowTask?: WorkflowTaskDto | null;

  @IsNumber()
  @IsOptional()
  workflowInstanceId?: number | null;

  @IsObject()
  @IsOptional()
  approvalMetadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}
