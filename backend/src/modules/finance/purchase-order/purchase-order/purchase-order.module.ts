import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { ItemReceiptsService } from '@modules/inventory/receipts/item-receipts/item-receipts.service';
import { DeliveryService } from '@modules/inventory/delivery/delivery/delivery.service';
import { InventoryService } from '@modules/inventory/inventory/inventory/inventory.service';
import { FundAccountService } from '@modules/finance/fund-account/fund-account/fund-account.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderService,
    ItemReceiptsService,
    DeliveryService,
    InventoryService,
    FundAccountService,
  ],
})
export class PurchaseOrderModule {}
