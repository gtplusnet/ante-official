import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { CreateItemCategoryRequest } from '@shared/request/item-category.request';

export class CreateItemCategoryDto implements CreateItemCategoryRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

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
