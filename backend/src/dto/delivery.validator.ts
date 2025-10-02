import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus, TruckLoadStage } from '@prisma/client';
import { ItemQuantityDto } from './inventory.validator';

export class SetStageForDeliveryDTO {
  @IsNotEmpty()
  @IsInt()
  deliveryId: number;

  @IsNotEmpty()
  @IsString()
  warehouseId: string;
}

export class ReceiveItemDTO {
  @IsNotEmpty()
  @IsInt()
  deliveryId: number;

  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items: ItemQuantityDto[];
}

export class CreateDeliveryDTO {
  @IsNotEmpty()
  @IsDateString()
  deliveryDate: Date;

  @IsNotEmpty()
  @IsNumber()
  sourceDeliveryReceiptId: number;

  @IsOptional()
  @IsString()
  fromWarehouseId: string;

  @IsOptional()
  @IsString()
  inTransitWarehouseId?: string;

  @IsNotEmpty()
  @IsString()
  toWarehouseId: string;

  @IsOptional()
  @IsString()
  pickUpLocationId?: string;

  @IsOptional()
  @IsString()
  status?: DeliveryStatus;

  @IsOptional()
  @IsNumber()
  inTransitDeliveryReceiptId?: number;

  @IsOptional()
  @IsString()
  truckLoadStage?: TruckLoadStage;
}
