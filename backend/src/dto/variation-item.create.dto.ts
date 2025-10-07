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
export class GetVariationItemDTO {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsOptional()
  @IsArray()
  variations?: any[];
}
export class CreateItemWithVariantsDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNotEmpty()
  @IsString()
  uom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedBuyingPrice?: number | null;

  @IsOptional()
  @IsNumber()
  size?: number | null;

  @IsBoolean()
  isDraft: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  tiers?: any[];

  @IsNumber()
  sellingPrice: number;

  @IsNumber()
  minimumStockLevel: number;

  @IsNumber()
  maximumStockLevel: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  enabledInPOS?: boolean;

  @IsOptional()
  @IsNumber()
  branchId?: number;
}
export class UpdateVariantDto {
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
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  minimumStockLevel?: number;

  @IsOptional()
  @IsNumber()
  maximumStockLevel?: number;

  @IsOptional()
  @IsNumber()
  estimatedBuyingPrice?: number;

  @IsOptional()
  @IsNumber()
  size?: number;
}
export class UpdateItemWithVariantsDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  minimumStockLevel?: number;

  @IsOptional()
  @IsNumber()
  maximumStockLevel?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  enabledInPOS?: boolean;

  @IsOptional()
  @IsNumber()
  branchId?: number;
}
export class CreateVariantDto {
  @IsOptional()
  variation?: any;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedBuyingPrice?: number;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsString()
  sku?: string;

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
export class CreateTierDto {
  @IsNotEmpty()
  @IsString()
  tierKey: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTierAttributeDto)
  attributes: CreateTierAttributeDto[];
}
export class CreateTierAttributeDto {
  @IsNotEmpty()
  @IsString()
  attributeKey: string;

  @IsOptional()
  @IsString()
  value?: string;
}
