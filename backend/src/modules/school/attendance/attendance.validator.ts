import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class AttendanceTableFilterDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(['student', 'guardian'])
  personType?: 'student' | 'guardian';

  @IsOptional()
  @IsIn(['check_in', 'check_out'])
  action?: 'check_in' | 'check_out';

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class AttendanceTableDto {
  @IsArray()
  @ValidateNested({ each: true })
  filters: any[];

  @IsOptional()
  settings: any;

  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @IsOptional()
  @IsString()
  searchBy?: string;
}

export class AttendanceExportDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(['student', 'guardian'])
  personType?: 'student' | 'guardian';

  @IsOptional()
  @IsIn(['check_in', 'check_out'])
  action?: 'check_in' | 'check_out';

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  format?: 'csv' | 'xlsx';
}
