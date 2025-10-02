import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
  ArrayNotEmpty,
  IsDateString,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma, ItemReceiptType } from '@prisma/client';

export class TransferWarehouseBasedOnReceiptDto {
  itemReceiptId: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  receiptTypeFrom: ItemReceiptType;
  receiptTypeTo: ItemReceiptType;
  items?: ItemQuantityDto[];
}

export enum TransferType {
  DELIVERY = 'delivery',
  DIRECT = 'direct',
}
export class TransferInventoryDto {
  @IsString()
  @IsNotEmpty()
  transferType: TransferType;

  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;

  @IsString()
  @IsOptional()
  inTransitWarehouseId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items: ItemQuantityDto[];

  @IsString()
  memo: string;

  @IsDateString()
  @IsOptional()
  deliveryDate: string;
}

export class ItemQuantityDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  itemInformation?: Prisma.ItemWhereUniqueInput;
}

export class RefillInventoryDto {
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items: ItemQuantityDto[];

  @IsString()
  @IsOptional()
  memo?: string;
}

export class WriteOffInventoryDto {
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items: ItemQuantityDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class InventoryInformationDto {
  itemNameAndSku: string;
  description: string;
  stocks: number;
  estimatedBuyingPrice: number;
  size: number;
  totalSizePerItem: number;
  totalEstimatedBuyingPricePerItem: number;
}

export class InventorySummaryDto {
  totalSize: number;
  totalEstimatedBuyingPrice: number;
  totalQuantity: number;
}

export class GetInventoryInformationResponseDto {
  items: InventoryInformationDto[];
  summary: InventorySummaryDto;
}
