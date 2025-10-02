import {
  AttendanceConflictType,
  AttendanceConflictAction,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetAttendanceConflictsDTO {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(AttendanceConflictType)
  conflictType?: AttendanceConflictType;

  @IsOptional()
  @IsBoolean()
  isResolved?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ResolveConflictDTO {
  @IsString()
  resolvedBy: string;
}

export class IgnoreConflictDTO {
  @IsEnum(AttendanceConflictAction)
  action: AttendanceConflictAction;
}

export class GetConflictStatsDTO {
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

export interface AttendanceConflictResponse {
  id: number;
  accountId: string;
  employeeTimekeepingId: number | null;
  conflictType: AttendanceConflictType;
  conflictDate: Date;
  dateString: string;
  description: string;
  shiftInfo: any;
  isResolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeData?: {
      employeeCode: string;
    };
  };
}

export interface AttendanceConflictStatsResponse {
  total: number;
  resolved: number;
  unresolved: number;
  byType: Record<AttendanceConflictType, number>;
}
