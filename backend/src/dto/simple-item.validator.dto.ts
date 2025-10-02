import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariantDto } from './variation-item.create.dto';
export class CreateSimpleItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  estimatedBuyingPrice: number;

  @IsNumber()
  size: number;

  @IsBoolean()
  isDraft: boolean;

  @IsString()
  uom: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsNumber()
  sellingPrice: number;

  @IsNumber()
  minimumStockLevel: number;

  @IsNumber()
  maximumStockLevel: number;
}
export class UpdateSimpleItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  uom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsNumber()
  estimatedBuyingPrice?: number;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsArray()
  tiers?: any[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  minimumStockLevel?: number;

  @IsOptional()
  @IsNumber()
  maximumStockLevel?: number;
}
