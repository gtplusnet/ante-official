import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddItemToCartRequest {
  @ApiProperty({
    description: 'UUID of the item from Item table',
    example: 'product-uuid-789',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Quantity of items to add',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Discount type',
    example: 'percentage',
    enum: ['percentage', 'fixed', 'promo'],
  })
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage (e.g., 10 for 10%)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed discount amount',
    example: 15.0,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
}

export class ChildItemRequest {
  @ApiProperty({
    description: 'UUID of the child item',
    example: 'coffee-uuid',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Quantity of this child item',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Whether this item is included in the combo',
    example: true,
  })
  @IsBoolean()
  isIncluded: boolean;
}

export class AddItemGroupToCartRequest {
  @ApiProperty({
    description: 'UUID of the ITEM_GROUP from Item table',
    example: 'breakfast-combo-uuid',
  })
  @IsString()
  @IsNotEmpty()
  groupItemId: string;

  @ApiProperty({
    description: 'Number of combos to add',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Array of child items with quantity and isIncluded flag',
    type: [ChildItemRequest],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildItemRequest)
  childItems: ChildItemRequest[];
}

export class UpdateCartItemRequest {
  @ApiPropertyOptional({
    description: 'New quantity',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'New discount percentage',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'New fixed discount amount',
    example: 20.0,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'For ITEM_GROUP children - include/exclude item',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;
}

export class UpdateCartRequest {
  @ApiPropertyOptional({
    description: 'Link to registered customer account',
    example: 'customer-account-uuid',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Name for walk-in customers',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Email for receipt',
    example: 'jane@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Special instructions or notes',
    example: 'Birthday celebration - add candles',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  QR_CODE = 'QR_CODE',
  GCASH = 'GCASH',
  PAYMAYA = 'PAYMAYA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
}

export class PaymentRequest {
  @ApiProperty({
    description: 'Payment method',
    example: 'CASH',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Amount paid with this method',
    example: 100.0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Transaction reference for digital payments',
    example: 'GC-TXN-123456',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

export class CheckoutCartRequest {
  @ApiPropertyOptional({
    description: 'Laborer who performed service',
    example: 'laborer-account-uuid',
  })
  @IsOptional()
  @IsString()
  laborerId?: string;

  @ApiProperty({
    description: 'Array of payment objects',
    type: [PaymentRequest],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentRequest)
  payments: PaymentRequest[];

  @ApiProperty({
    description: 'Total amount paid by customer',
    example: 150.0,
  })
  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @ApiPropertyOptional({
    description: 'Change to return',
    example: 15.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  changeAmount?: number;
}
