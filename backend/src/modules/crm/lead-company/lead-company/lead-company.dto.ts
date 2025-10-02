import { IsString, IsInt, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  employees: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  deals: number;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

export class UpdateLeadCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  employees?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  deals?: number;
}

export class LeadCompanyQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'employees' | 'deals' | 'dateCreated';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
