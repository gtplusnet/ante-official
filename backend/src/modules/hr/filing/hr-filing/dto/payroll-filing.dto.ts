import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PayrollFilingType } from '@prisma/client';
class WorkingHourDTO {
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isBreakTime?: boolean;
}
class LeaveDataDTO {
  @IsNotEmpty()
  @IsString()
  compensationType: string;

  @IsNotEmpty()
  @IsString()
  leaveType: string;
}
class ShiftDataDTO {
  @IsNotEmpty()
  @IsString()
  shiftCode: string;

  @IsNotEmpty()
  @IsString()
  shiftType: string;

  @IsOptional()
  @IsNumber()
  targetHours?: number;

  @IsOptional()
  @IsNumber()
  totalBreakHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDTO)
  workingHours?: WorkingHourDTO[];
}
export class CreatePayrollFilingDTO {
  @IsEnum(PayrollFilingType)
  filingType: PayrollFilingType;

  @IsOptional()
  @IsDateString()
  timeIn?: string;

  @IsOptional()
  @IsDateString()
  timeOut?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsNumber()
  nightDifferentialHours?: number;

  @IsOptional()
  @IsNumber()
  fileId?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  shiftType?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LeaveDataDTO)
  leaveData?: LeaveDataDTO;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShiftDataDTO)
  shiftData?: ShiftDataDTO;
}
export class UpdatePayrollFilingDTO extends CreatePayrollFilingDTO {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
export class FilingActionDTO {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
export class QueryFilingDTO {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsEnum(PayrollFilingType)
  filingType?: PayrollFilingType;

  @IsOptional()
  @IsString()
  cutoffDateRangeId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
