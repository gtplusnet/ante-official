import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

import {
  DeliveryTerms,
  ItemReceiptType,
  PaymentTerms,
  Prisma,
  TaxType,
} from '@prisma/client';

export class CreateReceiptDTO {
  @IsNotEmpty()
  @IsNumber()
  supplierId?: number;

  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @IsNotEmpty()
  @IsString()
  type: ItemReceiptType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  memo: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  itemList: Prisma.ItemReceiptItemsCreateManyInput[];

  @IsOptional()
  @IsString()
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsString()
  taxType?: TaxType;

  @IsOptional()
  @IsString()
  deliveryTerms?: DeliveryTerms;

  @IsOptional()
  @IsNumber()
  totalPayableAmount?: number;

  @IsOptional()
  @IsNumber()
  totalSettledAmount?: number;

  @IsOptional()
  @IsNumber()
  itemTotalCount?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  billOfQuantityId?: number;
}
