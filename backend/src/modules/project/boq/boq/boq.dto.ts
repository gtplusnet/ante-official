import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsDateString,
  Min,
  IsEnum,
  IsBoolean,
  IsInt,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillOfQuantityTable, BoqType } from '@prisma/client';
export class BoqCreateDTO {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  contractLocation?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsNumber()
  totalMaterialCost?: number;

  @IsOptional()
  @IsNumber()
  totalLaborCost?: number;

  @IsOptional()
  @IsNumber()
  totalDirectCost?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoqTableItemCreateDTO)
  boqTable: BoqTableItemCreateDTO[];
}
export class BoqTableItemCreateDTO {
  @IsOptional()
  @IsString()
  itemNumber?: string;

  @IsEnum(BoqType)
  type: BoqType;

  @IsNumber()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  particulars?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  materialUnitCost?: number;

  @IsOptional()
  @IsNumber()
  materialTotalCost?: number;

  @IsOptional()
  @IsNumber()
  laborUnitCost?: number;

  @IsOptional()
  @IsNumber()
  laborTotalCost?: number;

  @IsOptional()
  @IsNumber()
  directCost?: number;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoqTableItemCreateDTO)
  children?: BoqTableItemCreateDTO[];
}
export class BoqTableItemResponseDTO {
  id: number;
  parentId: number;
  type!: BoqType;
  order!: number;
  particulars!: string;
  itemNumber: string;
  subtotal!: number;
  children?: BoqTableItemResponseDTO[];
  originalItemId?: string;
}

export class BillOfQuantityResponseDTO {
  projectId!: number;
  contractId!: string;
  contractName!: string;
  subject!: string;
  contractLocation!: string;
  expirationDate!: string;
  totalCost!: number;
  totalMaterialCost!: number;
  totalLaborCost!: number;
  boqTable!: BoqTableItemResponseDTO[];
}

export class BoqFormUpsertDTO {
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  contractLocation?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
export class CreateBoqRowDTO {
  @IsNumber()
  billOfQuantityId: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDTO)
  items?: InventoryItemDTO[];
}
export class UpdateBoqCellDTO {
  @IsString()
  field: keyof BillOfQuantityTable;

  value: number | string;
}
export class CreateNewRevisionDTO {
  @IsNumber()
  billOfQuantityId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
export class BillOfQuantityQueryParamsDTO {
  @IsInt()
  @Type(() => Number)
  revision?: number;
  revisionFrom?: number;
  revisionTo?: number;
  @Type(() => Boolean)
  latest?: boolean;
  @Min(1)
  page = 1;
  pageSize = 10;
}

export class BoqRevisionResponseDTO extends BillOfQuantityResponseDTO {
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  updatedById: string | null;
}

export class PaginationBoqResponseDTO {
  revisions: BoqRevisionResponseDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export class InventoryItemDTO {
  id?: string;
  sku?: string;
  itemDescription?: string;
  variationFor?: string;
  size?: string;
  estimatedBuyingPrice?: number;
}

export class PriceInformationDTO {
  billOfQuantityTableId: number;
  unitPrice: number;
  estimatedPrice: number;
}

export class GetPriceInformationDTO {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  billOfQuantityTableIds: number[];
}
export class InsertQuantityTakeOffItemDTO {
  key: number;
  itemId: string;
  amount: number;
}

export class CreateVersionDTO {
  @IsString()
  versionTitle: string;

  @IsNumber()
  sourceBoqId: number;

  @IsNumber()
  projectId: number;
}
