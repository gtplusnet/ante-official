import { IsInt, IsOptional, IsNumber, IsString, IsBoolean, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class StartTimerDto {
  @ValidateIf((o) => o.taskId !== undefined && o.taskId !== null && o.taskId !== '')
  @IsInt()
  @Type(() => Number)
  taskId?: number;

  // TIME-IN GEOLOCATION FIELDS
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeInLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeInLongitude?: number;

  @IsOptional()
  @IsString()
  timeInLocation?: string;

  @IsOptional()
  @IsBoolean()
  timeInGeolocationEnabled?: boolean;
}