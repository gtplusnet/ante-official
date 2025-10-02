import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  IsEnum,
  IsDateString,
  ValidateIf,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EquipmentState } from '@prisma/client';

export class EquipmentModelCreateDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Plate number must be at least 6 characters long.' })
  plateNum?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}

export class EquipmentCreateDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentModelCreateDTO)
  equipmentModels: EquipmentModelCreateDTO[];

  @IsOptional()
  @IsString()
  equipmentId?: string;
}

export class AddEquipmentModelsDTO {
  @IsNotEmpty()
  @IsString()
  equipmentId: string;

  @ValidateNested({ each: true })
  @Type(() => EquipmentModelCreateDTO)
  equipmentModels: EquipmentModelCreateDTO[];
}

export class CreateMaintenanceScheduleDTO {
  @IsString()
  @IsNotEmpty()
  equipmentModelId: string;

  @IsEnum(EquipmentState)
  status: EquipmentState;

  @IsOptional()
  @IsDateString()
  startDate: Date;
}

export class UpdateMaintenanceScheduleDTO {
  @IsString()
  @IsNotEmpty()
  equipmentModelId: string;

  @IsString()
  @IsNotEmpty()
  maintenanceHistoryId: string;

  @IsEnum(EquipmentState)
  status: EquipmentState;

  @IsDateString()
  startDate: string; // Use string to match the request format

  @IsOptional()
  @ValidateIf((o) => o.endDate !== '')
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate?: string; // Optional, and also a string
}

export class EquipmentModelDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  plateNum: string;

  @IsString()
  @IsOptional()
  number: string | null;

  @IsString()
  locationId: string;

  @IsString()
  status: string;

  @IsString()
  type: string;

  @IsUUID()
  @IsOptional()
  driverId: string | null;

  @IsUUID()
  @IsOptional()
  maintenanceScheduleId: string | null;

  @IsString()
  maintenanceSchedule: string;
}

export class GetEquipmentDetailsResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  createdAt: string;

  @IsNumber()
  modelCount: number;

  @IsArray()
  models: EquipmentModelDto[];
}

export class GetEquipmentModelDetailsResponseDto {
  id: string;
  name: string;
  plateNum: string;
  number: string;
  equipmentId: string;
  equipmentName: string;
  locationId: string;
  status: string;
  type: string;

  // Driver-related fields
  driverId?: string | null; // Optional and nullable
  driverName?: string | null; // Optional and nullable
  driverDetails?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    status: string;
    createdAt: {
      dateTime: string;
      time: string;
      date: string;
      dateFull: string;
      raw: string;
    };
    role: string;
    parentAccountId: string;
    image: string;
  } | null; // Optional and nullable

  // Maintenance-related fields
  maintenanceScheduleId: string | null;
  maintenanceSchedule: string;
}
