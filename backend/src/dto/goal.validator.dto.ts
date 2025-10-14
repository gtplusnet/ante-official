import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class GoalCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsDateString()
  readonly deadline?: string;
}

export class GoalUpdateDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsDateString()
  readonly deadline?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  readonly status?: GoalStatus;
}

export class GoalIdDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}

export class GoalLinkTaskDto {
  @IsNotEmpty()
  @IsNumber()
  readonly goalId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;
}

export class GoalLinkMultipleTasksDto {
  @IsNotEmpty()
  @IsNumber()
  readonly goalId: number;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  readonly taskIds: number[];
}

export class GoalUnlinkTaskDto {
  @IsNotEmpty()
  @IsNumber()
  readonly taskId: number;
}

export class GoalFilterDto {
  @IsOptional()
  @IsEnum(GoalStatus)
  readonly status?: GoalStatus;

  @IsOptional()
  @IsString()
  readonly search?: string;
}
