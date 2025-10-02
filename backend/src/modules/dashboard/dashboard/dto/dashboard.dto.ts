import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetEmployeePayslipsDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
export class GetDashboardMetricsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
export class GetEmployeeAttendanceDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
export class GetEmployeeAttendanceConflictsDto {
  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '10';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
