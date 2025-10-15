import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { QueryItemCategoryRequest } from '@shared/request/item-category.request';

export class QueryItemCategoryDto implements QueryItemCategoryRequest {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
