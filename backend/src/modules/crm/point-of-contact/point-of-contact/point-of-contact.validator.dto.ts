import {
  IsString,
  IsEmail,
  IsInt,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePointOfContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  companyId: number;
}

export class UpdatePointOfContactDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  companyId?: number;
}

export class FilterPointOfContactDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  companyId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'Date Created',
    'Name (A-Z)',
    'Name (Z-A)',
    'Company',
    'Recent Activity',
  ])
  sortBy?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  showArchived?: boolean;
}

export class BulkCreatePointOfContactDto {
  @IsArray()
  contacts: CreatePointOfContactDto[];
}
