import { Response } from 'express';
import {
  Controller,
  Get,
  Post,
  Response as NestResponse,
  Query,
  Body,
  Inject,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PurchaseOrderService } from './purchase-order.service';
import {
  PurchaseOrderDto,
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  SubmitSupplierSelection,
  createPaymentDto,
} from '../../../../dto/purchase-order.dto';
import { DeliveryTerms, PaymentTerms } from '@prisma/client';

@Controller('purchase-order')
export class PurchaseOrderController {
  @Inject() public utility: UtilityService;
  @Inject() public purchaseOrderService: PurchaseOrderService;

  @Get('payment-history')
  async getPaymentHistory(
    @NestResponse() response: Response,
    @Query('purchaseOrderId') purchaseOrderId: number,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.getPaymentHistory(purchaseOrderId),
      response,
    );
  }

  @Post('create-payment')
  async createPayment(
    @NestResponse() response: Response,
    @Body() body: createPaymentDto,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.createPayment(body),
      response,
    );
  }

  @Post('submit-supplier-selection')
  async submitSupplierSelection(
    @NestResponse() response: Response,
    @Body() body: SubmitSupplierSelection,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.submitSupplierSelection(body),
      response,
    );
  }

  @Get('canvass')
  async getCanvass(
    @NestResponse() response: Response,
    @Query('purchaseRequestId') purchaseRequestId: number,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.getCanvass(purchaseRequestId),
      response,
    );
  }

  @Post('canvass/add-supplier')
  async addSupplierToCanvass(
    @NestResponse() response: Response,
    @Body('purchaseRequestId') purchaseRequestId: number,
    @Body('supplierId') supplierId: number,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.addSupplierToCanvass(
        purchaseRequestId,
        supplierId,
      ),
      response,
    );
  }

  @Post('canvass/update-delivery-terms')
  async updateDeliveryTerms(
    @NestResponse() response: Response,
    @Body('purchaseRequestId') purchaseRequestId: number,
    @Body('supplierId') supplierId: number,
    @Body('deliveryTerms') deliveryTerms: DeliveryTerms,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.updateDeliveryTerms(
        purchaseRequestId,
        supplierId,
        deliveryTerms,
      ),
      response,
    );
  }

  @Post('canvass/update-payment-terms')
  async updatePaymentTerms(
    @NestResponse() response: Response,
    @Body('purchaseRequestId') purchaseRequestId: number,
    @Body('supplierId') supplierId: number,
    @Body('paymentTerms') paymentTerms: PaymentTerms,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.updatePaymentTerms(
        purchaseRequestId,
        supplierId,
        paymentTerms,
      ),
      response,
    );
  }

  @Post('canvass/delete-supplier')
  async removeSupplierFromCanvass(
    @NestResponse() response: Response,
    @Body('purchaseRequestId') purchaseRequestId: number,
    @Body('supplierId') supplierId: number,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.deleteSupplierFromCanvass(
        purchaseRequestId,
        supplierId,
      ),
      response,
    );
  }

  @Get()
  async getPurchaseOrderInfo(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.getPurchaseOrderInfo(id),
      response,
    );
  }
  @Post('request-update')
  async updatePurchaseRequest(
    @NestResponse() response: Response,
    @Body() body: UpdatePurchaseRequestDto,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.updatePurchaseRequest(body),
      response,
    );
  }
  @Post('request')
  async createPurchaseRequest(
    @NestResponse() response: Response,
    @Body() body: CreatePurchaseRequestDto,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.createPurchaseRequest(body),
      response,
    );
  }
  @Post()
  async createPurchaseOrder(
    @NestResponse() response: Response,
    @Body() body: PurchaseOrderDto,
  ) {
    return this.utility.responseHandler(
      this.purchaseOrderService.createPurchaseOrder(body),
      response,
    );
  }
}
