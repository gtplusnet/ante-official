import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskAndStartDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

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