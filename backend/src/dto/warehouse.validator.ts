import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { WarehouseType } from '@prisma/client';

export class WarehouseCreateDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  locationId: string;

  @IsOptional()
  @IsNumber()
  projectId: number;

  @IsNotEmpty()
  @IsNumber()
  capacity: number;

  @IsNotEmpty()
  @IsString()
  warehouseType: WarehouseType;

  @IsOptional()
  @IsNumber()
  equipmentId?: number;
}

export class WarehouseUpdateDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class WarehouseReadDTO {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class WarehouseDeleteDTO {
  @IsNotEmpty()
  @IsString()
  id: string;
}
