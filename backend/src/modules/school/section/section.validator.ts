import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  gradeLevelId: number;

  @IsString()
  @IsNotEmpty()
  adviserName: string;

  @IsString()
  @IsNotEmpty()
  schoolYear: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  gradeLevelId?: number;

  @IsString()
  @IsOptional()
  adviserName?: string;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SectionTableRequestDto {
  @IsString()
  @IsOptional()
  searchKeyword?: string;

  @IsNumber()
  @IsOptional()
  gradeLevelId?: number;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}