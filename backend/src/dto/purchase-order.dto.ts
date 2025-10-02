import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import {
  Prisma,
  ItemReceiptType,
  TaxType,
  PaymentTerms,
  DeliveryTerms,
  PurchaseRequestStatus,
} from '@prisma/client';
export class ItemListDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsNumber()
  rate: number;

  @IsOptional()
  itemInformation?: Prisma.ItemWhereUniqueInput;

  @IsOptional()
  purchaseRequestItem?: Prisma.ItemReceiptItemsWhereUniqueInput;

  @IsOptional()
  @IsNumber()
  boqKey?: number;

  @IsString()
  itemName: string;

  @IsNumber()
  amount: number;
}
export class createPaymentDto {
  @IsNumber()
  purchaseOrderId: number;

  @IsNumber()
  paymentAccountId: number;

  @IsNumber()
  paymentAmount: number;

  @IsNumber()
  fee: number;
}
export class SubmitSupplierSelection {
  @IsNumber()
  readonly purchaseRequestId: number;

  @IsArray()
  items: SupplierSelectionItems[];
}
export class SupplierSelectionItems {
  @IsNumber()
  readonly supplierId: number;

  @IsString()
  readonly itemId: string;

  @IsNumber()
  readonly itemRate: number;
}
export class UpdatePurchaseRequestDto {
  @IsString()
  readonly status: PurchaseRequestStatus;

  @IsOptional()
  @IsNumber()
  purchaseRequestId?: number;
}
export class CreatePurchaseRequestDto {
  @IsString()
  readonly warehouseId: string;

  @IsNumber()
  readonly projectId: number;

  @IsArray()
  @ArrayMinSize(1)
  items: ItemListDto[];

  @IsOptional()
  @IsString()
  memo: string;

  @IsString()
  deliveryDate: string;

  @IsOptional()
  @IsNumber()
  billOfQuantityId?: number;
}
export class PurchaseOrderDto {
  @IsString()
  readonly type: ItemReceiptType;

  @IsString()
  readonly memo: string;

  @IsOptional()
  iteminformation?: Prisma.ItemWhereUniqueInput;

  @IsString()
  paymentTerms: PaymentTerms;

  @IsString()
  deliveryTerms: DeliveryTerms;

  @IsString()
  pickupLocationId: string;

  @IsString()
  taxType: TaxType;

  @IsOptional()
  @IsNumber()
  purchaseRequestId?: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsArray()
  items?: ItemListDto[];

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}
