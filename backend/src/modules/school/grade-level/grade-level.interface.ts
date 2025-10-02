import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { EducationLevel } from '@prisma/client';

export class GradeLevelCreateDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(EducationLevel)
  @IsNotEmpty()
  educationLevel: EducationLevel;

  @IsInt()
  @IsNotEmpty()
  sequence: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  ageRangeMin?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  ageRangeMax?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class GradeLevelUpdateDTO extends GradeLevelCreateDTO {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
