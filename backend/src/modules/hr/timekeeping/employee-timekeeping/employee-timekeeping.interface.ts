import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { IsDateGreaterThan } from '@common/dto/validators/date-range.validator';
import { Type } from 'class-transformer';
import { DateFormat } from '../../../../shared/response/utility.format';
import { EmployeeDataResponse } from '../../../../shared/response/employee.response';
import {
  ComputeTimekeepingRequest,
  TimeInOutRequest,
  EmployeeTimekeepingRequest,
  RecomputeTimekeepingRequest,
  TimekeepingOverrideRequest,
  RecomputeTimekeepingCutoffRequest,
  SubmitForPayrollProcessingRequest,
  RecomputeAllTimekeepingRequest,
} from '../../../../shared/request/timekeeping.request';

export class ComputeTimekeepingDTO implements ComputeTimekeepingRequest {
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Employee ID does not exist.' })
  employeeAccountId: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TimeInOutDTO)
  simulatedTime: TimeInOutDTO[];
}

export class SubmitForPayrollProcessingDTO
  implements SubmitForPayrollProcessingRequest
{
  @IsNotEmpty()
  @IsString()
  @Exists('cutoffDateRange', 'id', {
    message: 'Cutoff date range does not exist.',
  })
  cutoffDateRangeId: string;
}

export class TimekeepingOverrideClearDTO {
  @IsNotEmpty()
  @IsNumber()
  @Exists('employeeTimekeeping', 'id', {
    message: 'Employee ID does not exist.',
  })
  timekeepingId: number;
}

export class TimekeepingOverrideDTO implements TimekeepingOverrideRequest {
  @IsNotEmpty()
  @IsNumber()
  @Exists('employeeTimekeeping', 'id', {
    message: 'Employee ID does not exist.',
  })
  timekeepingId: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  worktime: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  nightDifferential: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  overtime: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  nightDifferentialOvertime: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  late: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(1440)
  undertime: number;
}

export class RecomputeAllTimekeepingDTO
  implements RecomputeAllTimekeepingRequest
{
  @IsNotEmpty()
  @IsString()
  @Exists('cutoffDateRange', 'id', {
    message: 'Cutoff Date Range ID does not exist.',
  })
  cutoffDateRangeId: string;
}

export class RecomputeTimekeepingDTO implements RecomputeTimekeepingRequest {
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Employee ID does not exist.' })
  employeeAccountId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export class RecomputeCutoffTimekeepingDTO
  implements RecomputeTimekeepingCutoffRequest
{
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Employee ID does not exist.' })
  employeeAccountId: string;

  @IsNotEmpty()
  @IsString()
  @Exists('cutoffDateRange', 'id', {
    message: 'Cutoff date range does not exist.',
  })
  cutoffDateRangeId: string;
}

export class TimeInOutDTO implements TimeInOutRequest {
  @IsNotEmpty()
  @IsDateString()
  timeIn: string;

  @IsNotEmpty()
  @IsDateString()
  @IsDateGreaterThan('timeIn')
  timeOut: string;
}

export class EmployeeTimekeepingDTO implements EmployeeTimekeepingRequest {
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Employee ID does not exist.' })
  employeeAccountId: string;

  @IsNotEmpty()
  @IsString()
  @Exists('cutoffDateRange', 'id', { message: 'Range does not exist.' })
  cutoffDateRange: string;
}

export class EmployeeTimekeepingByDateDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Employee ID does not exist.' })
  employeeAccountId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export interface RequestEmployeeTimekeepingByDate {
  employeeAccountId: string;
  date: DateFormat;
  cutoffDateRangeId?: string;
}

export interface ResponseEmployeeTimekeeping {
  employeeId: string;
  employeeName: string;
  employeeAccountId: string;
  employeeData: EmployeeDataResponse;
}
