import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAttendanceLogsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  days?: number = 7;
}

export class StudentStatusDto {
  studentId: string;
  studentName: string;
  studentNumber: string;
  currentStatus: 'in_school' | 'out_of_school' | 'no_attendance';
  lastAction?: {
    type: 'check_in' | 'check_out';
    timestamp: string;
    location?: string;
  };
}

export class AttendanceLogDto {
  id: string;
  studentId: string;
  studentName: string;
  action: 'check_in' | 'check_out';
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
  location?: string;
  deviceId?: string;
}

export class AttendanceLogsResponseDto {
  logs: AttendanceLogDto[];
  total: number;
  hasMore: boolean;
}

export class StudentStatusResponseDto {
  statuses: StudentStatusDto[];
}
