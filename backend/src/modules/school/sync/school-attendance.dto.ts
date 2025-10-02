import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
export class SchoolAttendanceRecordDto {
  @IsString()
  id: string;

  @IsString()
  qrCode: string;

  @IsString()
  personId: string;

  @IsIn(['student', 'guardian'])
  personType: 'student' | 'guardian';

  @IsString()
  personName: string;

  @IsIn(['check_in', 'check_out'])
  action: 'check_in' | 'check_out';

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
export class SchoolAttendanceBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolAttendanceRecordDto)
  records: SchoolAttendanceRecordDto[];
}
export class SchoolAttendanceSyncResponseDto {
  @IsNumber()
  received: number;

  @IsNumber()
  processed: number;

  @IsNumber()
  failed: number;

  @IsArray()
  @IsString({ each: true })
  failedRecordIds: string[];

  @IsArray()
  @IsString({ each: true })
  processedRecordIds: string[];

  @IsDateString()
  serverTime: string;
}
export class SchoolAttendancePendingDto {
  @IsNumber()
  pendingCount: number;

  @IsOptional()
  @IsDateString()
  oldestPendingTime: string | null;
}
