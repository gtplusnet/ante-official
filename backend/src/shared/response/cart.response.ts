import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemResponse {
  @ApiProperty({ example: 'cartitem-uuid-123' })
  id: string;

  @ApiProperty({ example: 'cart-uuid-456' })
  cartId: string;

  @ApiPropertyOptional({ example: 'product-uuid-789' })
  itemId?: string;

  @ApiPropertyOptional({ example: 'parent-cartitem-uuid' })
  parentCartItemId?: string;

  @ApiProperty({ example: 'Coffee' })
  itemName: string;

  @ApiPropertyOptional({ example: '/images/coffee.jpg' })
  itemImage?: string;

  @ApiProperty({ example: 'INDIVIDUAL_PRODUCT' })
  itemType: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 50.0 })
  unitPrice: number;

  @ApiProperty({ example: 100.0 })
  subtotal: number;

  @ApiPropertyOptional({ example: 'percentage' })
  discountType?: string;

  @ApiPropertyOptional({ example: 10 })
  discountPercentage?: number;

  @ApiProperty({ example: 10.0 })
  discountAmount: number;

  @ApiProperty({ example: 90.0 })
  totalAfterDiscount: number;

  @ApiProperty({ example: true })
  isIncluded: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class CartSummaryResponse {
  @ApiProperty({ example: 150.0 })
  subtotal: number;

  @ApiProperty({ example: 15.0 })
  discountAmount: number;

  @ApiProperty({ example: 135.0 })
  total: number;
}

export class CartResponse {
  @ApiProperty({ example: 'cart-uuid-123' })
  id: string;

  @ApiProperty({ example: 'cashier-account-id' })
  cashierId: string;

  @ApiPropertyOptional({ example: 'customer-account-id' })
  customerId?: string;

  @ApiProperty({ example: 150.0 })
  subtotal: number;

  @ApiProperty({ example: 15.0 })
  discountAmount: number;

  @ApiProperty({ example: 135.0 })
  total: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  customerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Gift wrap requested' })
  remarks?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [CartItemResponse] })
  items: CartItemResponse[];
}

export class SaleItemResponse {
  @ApiProperty({ example: 'saleitem-uuid-123' })
  id: string;

  @ApiProperty({ example: 'Coffee' })
  itemName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 50.0 })
  unitPrice: number;

  @ApiProperty({ example: 90.0 })
  totalAfterDiscount: number;
}

export class SalePaymentResponse {
  @ApiProperty({ example: 'payment-uuid-456' })
  id: string;

  @ApiProperty({ example: 'CASH' })
  paymentMethod: string;

  @ApiProperty({ example: 100.0 })
  amount: number;

  @ApiPropertyOptional({ example: 'GC-TXN-123456' })
  referenceNumber?: string;
}

export class SaleResponse {
  @ApiProperty({ example: 'sale-uuid-789' })
  id: string;

  @ApiProperty({ example: '00000053' })
  saleNumber: string;

  @ApiProperty({ example: 150.0 })
  subtotal: number;

  @ApiProperty({ example: 15.0 })
  discountAmount: number;

  @ApiProperty({ example: 135.0 })
  total: number;

  @ApiProperty({ example: 150.0 })
  paymentAmount: number;

  @ApiProperty({ example: 15.0 })
  changeAmount: number;

  @ApiProperty({ example: 'cashier-account-uuid' })
  cashierId: string;

  @ApiPropertyOptional({ example: 'laborer-account-uuid' })
  laborerId?: string;

  @ApiPropertyOptional({ example: 'customer-account-uuid' })
  customerId?: string;

  @ApiProperty({ example: 1 })
  branchId: number;

  @ApiProperty({ example: 'PROCESSED' })
  status: string;

  @ApiProperty({ example: 'John Doe' })
  cashierName: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  laborerName?: string;

  @ApiPropertyOptional({ example: 'Alice Johnson' })
  customerName?: string;

  @ApiProperty({ example: 'Main Branch' })
  branchName: string;

  @ApiProperty()
  createdAt: Date;
}

export class CheckoutResponse {
  @ApiProperty({ type: SaleResponse })
  sale: SaleResponse;

  @ApiProperty({ type: [SaleItemResponse] })
  saleItems: SaleItemResponse[];

  @ApiProperty({ type: [SalePaymentResponse] })
  payments: SalePaymentResponse[];

  @ApiProperty({ example: true })
  cartCleared: boolean;
}
