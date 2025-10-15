import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TaskAssignMode, TaskWatcherType } from '@prisma/client';
export class AddWatcherDTO {
  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;

  @IsNotEmpty()
  @IsString()
  readonly accountId: string;
}
export class TaskCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsNumber()
  readonly projectId: number;

  @IsOptional()
  @IsNumber()
  boardLaneId?: number;

  @IsOptional()
  @IsNumber()
  readonly order?: number;

  @IsNumber()
  readonly difficulty: number;

  @IsOptional()
  @IsString()
  readonly assignedToId?: string;

  @IsOptional()
  @IsString()
  readonly roleGroupId?: string;

  @IsEnum(TaskAssignMode)
  readonly assignedMode: TaskAssignMode;

  @IsOptional()
  @IsDateString()
  readonly dueDate?: string;

  @IsOptional()
  @IsNumber()
  readonly goalId?: number;
}
export class TaskUpdateDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly assignee?: string;

  @IsOptional()
  @IsString()
  readonly assignedToId?: string;

  @IsOptional()
  @IsNumber()
  readonly priorityLevel?: number;

  @IsOptional()
  @IsNumber()
  readonly difficultyLevel?: number;

  @IsOptional()
  @IsString()
  readonly dueDate?: string;

  @IsOptional()
  @IsNumber()
  readonly projectId?: number;

  @IsOptional()
  @IsNumber()
  readonly boardLaneId?: number;

  @IsOptional()
  @IsNumber()
  readonly goalId?: number;
}
export class TaskDeleteDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}
export class TaskAssignToIdDto {
  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;

  @IsNotEmpty()
  @IsString()
  readonly assignedToId: string;

  @IsEnum(TaskAssignMode)
  readonly assignedMode: TaskAssignMode;

  @IsOptional()
  @IsNumber()
  readonly roleGroupId?: number;
}
export class TaskWatcherDto {
  @IsArray()
  accountIds: string[];

  @IsNumber()
  taskId: number;

  @IsEnum(TaskWatcherType)
  watcherType: TaskWatcherType;
}
export class ClaimTaskParamsDto {
  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;
}
export class AssignTaskParamsDto {
  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;

  @IsOptional()
  @IsString()
  readonly assignedToId?: string;
}
export class TaskIdDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}
export enum TaskStatus {
  active = 'active',
  completed = 'completed',
  past_due = 'past_due',
  assigned = 'assigned',
}
export class TaskFilterDto {
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  taskStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortType?: string;

  @IsOptional()
  descending?: boolean;
}
export class TaskDashboardQueryDto {
  @IsNotEmpty()
  @IsEnum(['active', 'assigned', 'approvals'])
  readonly tab: 'active' | 'assigned' | 'approvals';

  @IsOptional()
  @IsString()
  readonly search?: string;
}
