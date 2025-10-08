import { IsInt, IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StartTimerDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  taskId: number;

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