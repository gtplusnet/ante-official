import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { UpdateItemCategoryRequest } from '@shared/request/item-category.request';

export class UpdateItemCategoryDto implements UpdateItemCategoryRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  parentId?: number | null;
}
