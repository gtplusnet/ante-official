import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
export class ItemAdvanceViewDto {
  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  variationFor: string;

  @IsOptional()
  @IsString()
  size: string;

  @IsOptional()
  @IsString()
  estimatedBuyingPrice: string;
}
export class UpdateItemWithVariantsDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants: UpdateVariantDto[];
}
export class UpdateVariantDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNumber()
  estimatedBuyingPrice: number;

  @IsNumber()
  size: number;

  @IsNumber()
  sellingPrice: number;

  @IsNumber()
  minimumStockLevel: number;

  @IsNumber()
  maximumStockLevel: number;
}
