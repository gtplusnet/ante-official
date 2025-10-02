import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt } from 'class-validator';
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
}