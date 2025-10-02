import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IndividualScheduleAssignmentDTO {
  @IsString()
  employeeId: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
    message: 'Date must be in MM/DD/YYYY format',
  })
  date: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  shiftId?: number;
}

export class BulkScheduleAssignmentDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualScheduleAssignmentDTO)
  assignments: IndividualScheduleAssignmentDTO[];
}

export class GetScheduleAssignmentsDTO {
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
    message: 'Start date must be in MM/DD/YYYY format',
  })
  startDate: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
    message: 'End date must be in MM/DD/YYYY format',
  })
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}

export interface ScheduleAssignmentResponse {
  id: number;
  employeeId: string;
  date: string;
  projectId: number | null;
  shiftId: number | null;
  updatedAt: Date;
  updatedById: string;
  updatedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface TeamScheduleForEmployeeResponse {
  employeeId: string;
  teamId: number;
  teamName: string;
  date: string;
  projectId: number | null;
  shiftId: number | null;
}
