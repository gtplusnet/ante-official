import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export interface SchedulerResponse {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  taskType: string;
  taskConfig: Record<string, any>;
  isActive: boolean;
  status: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastStatus: string;
  lastDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerExecutionResponse {
  id: string;
  schedulerId: string;
  schedulerName: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  output?: string;
  error?: string;
  createdAt: Date;
}

export interface SchedulerStatsResponse {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  successRate: number;
}

export class CreateSchedulerDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'Invalid cron expression format',
    },
  )
  cronExpression: string;

  @IsNotEmpty()
  @IsString()
  taskType: string;

  @IsOptional()
  @IsObject()
  taskConfig?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSchedulerDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'Invalid cron expression format',
    },
  )
  cronExpression?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsOptional()
  @IsObject()
  taskConfig?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export interface SchedulerTask {
  execute(config: Record<string, any>): Promise<void | string>;
  getName(): string;
  getDescription(): string;
}
