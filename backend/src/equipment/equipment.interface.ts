import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EquipmentType } from '@prisma/client';
export class EquipmentCreateDTO {
  id?: number;

  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly serialCode: string;

  @IsNotEmpty()
  @IsNumber()
  readonly brandId: number;

  @IsNotEmpty()
  @IsString()
  readonly equipmentType: EquipmentType;

  @IsNotEmpty()
  @IsString()
  readonly currentWarehouseId: string;
}

export class EquipmentPartCreateDTO {
  @IsNotEmpty()
  @IsString()
  readonly partName: string;

  @IsNotEmpty()
  @IsNumber()
  readonly equipmentId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly scheduleDay: number;
}

export class EquipmentItemCreateDTO {
  @IsNotEmpty()
  @IsString()
  readonly itemId: string;

  @IsNotEmpty()
  @IsNumber()
  readonly partId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;
}

export class RepairItemBreakdown {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  readonly itemId: string;

  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;
}

export class EquipmentMaintenanceCreateDTO {
  @IsNotEmpty()
  @IsNumber()
  readonly partId: number;

  @IsNotEmpty()
  @IsBoolean()
  readonly isWorking: boolean;

  @IsNotEmpty()
  @IsNumber()
  readonly maintenanceProof: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairItemBreakdown)
  readonly repairItemBreakdown?: RepairItemBreakdown[];
}

export class EquipmentPartsSetNextMaintenanceDate {
  @IsNotEmpty()
  @IsNumber()
  readonly partId: number;

  @IsNotEmpty()
  @IsDateString()
  readonly nextMaintenanceDate: Date;
}
