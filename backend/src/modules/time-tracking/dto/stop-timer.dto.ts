import { IsOptional, IsDateString, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StopTimerDto {
  @IsOptional()
  @IsDateString()
  timeOut?: string;

  // TIME-OUT GEOLOCATION FIELDS
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeOutLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeOutLongitude?: number;

  @IsOptional()
  @IsString()
  timeOutLocation?: string;

  @IsOptional()
  @IsBoolean()
  timeOutGeolocationEnabled?: boolean;
}