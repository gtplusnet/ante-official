import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CartService } from './cart.service';
import {
  AddItemToCartRequest,
  AddItemGroupToCartRequest,
  UpdateCartItemRequest,
  UpdateCartRequest,
  CheckoutCartRequest,
} from '@shared/request/cart.request';
import { PosDeviceAuthGuard } from '@modules/pos/guards/pos-device-auth.guard';
import { PosDeviceRequest } from '@modules/pos/interfaces/pos-device.request';

@ApiTags('POS - Cart')
@Controller('pos/cart')
@UseGuards(PosDeviceAuthGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'POS Device API Key',
  required: true,
})
@ApiHeader({
  name: 'x-cashier-id',
  description: 'Cashier Account ID',
  required: true,
})
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cashier cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  async getCart(@Req() request: PosDeviceRequest) {
    const accountId = request.cashier.accountId;
    const cart = await this.cartService.getCart(accountId);

    return request['utility'].responseHandler(cart, request);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
  })
  async addItem(
    @Body() body: AddItemToCartRequest,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.addItem(accountId, body);

    return request['utility'].responseHandler(result, request);
  }

  @Post('items/group')
  @ApiOperation({ summary: 'Add item group (combo) to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item group added to cart successfully',
  })
  async addItemGroup(
    @Body() body: AddItemGroupToCartRequest,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.addItemGroup(accountId, body);

    return request['utility'].responseHandler(result, request);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update cart item' })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemRequest,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.updateItem(accountId, itemId, body);

    return request['utility'].responseHandler(result, request);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.removeItem(accountId, itemId);

    return request['utility'].responseHandler(result, request);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Req() request: PosDeviceRequest) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.clearCart(accountId);

    return request['utility'].responseHandler(result, request);
  }

  @Put()
  @ApiOperation({ summary: 'Update cart customer info' })
  @ApiResponse({
    status: 200,
    description: 'Cart updated successfully',
  })
  async updateCart(
    @Body() body: UpdateCartRequest,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const result = await this.cartService.updateCart(accountId, body);

    return request['utility'].responseHandler(result, request);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Checkout - Convert cart to sale' })
  @ApiResponse({
    status: 200,
    description: 'Checkout successful - Sale created',
  })
  async checkout(
    @Body() body: CheckoutCartRequest,
    @Req() request: PosDeviceRequest,
  ) {
    const accountId = request.cashier.accountId;
    const branchId = request.branchId;
    const result = await this.cartService.checkout(accountId, branchId, body);

    return result; // Direct return - NestJS handles JSON serialization
  }
}
