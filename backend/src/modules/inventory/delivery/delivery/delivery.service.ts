import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TruckLoadStage,
  ItemReceiptType,
  DeliveryStatus,
} from '@prisma/client';
import { CreateDeliveryDTO } from '../../../../dto/delivery.validator';
import { PrismaService } from '@common/prisma.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import {
  SetStageForDeliveryDTO,
  ReceiveItemDTO,
} from '../../../../dto/delivery.validator';
import { InventoryService } from '@modules/inventory/inventory/inventory/inventory.service';
import { TransferWarehouseBasedOnReceiptDto } from '../../../../dto/inventory.validator';
import deliveryStatusReference from '../../../../reference/delivery-status.reference';
import truckLoadStageReference from '../../../../reference/truck-load-stage.reference';

@Injectable()
export class DeliveryService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public inventoryService: InventoryService;

  async receiveItem(data: ReceiveItemDTO) {
    let remaining = 0;
    const deliveryInformation = await this.prisma.delivery.findUnique({
      where: { id: data.deliveryId },
      include: { sourceDeliveryReceipt: true, inTransitWarehouse: true },
    });

    const items = await this.prisma.itemReceiptItems.findMany({
      where: { itemReceiptId: deliveryInformation.inTransitDeliveryReceiptId },
    });

    // Check if items are more than the quantity on receipt
    for (const item of data.items) {
      const itemInfo = items.find((x) => x.itemId == item.itemId);

      if (itemInfo.remainingQuantity < item.quantity) {
        throw new BadRequestException(
          'You will exceed the number of items that were delivered.',
        );
      } else {
        itemInfo.remainingQuantity = itemInfo.remainingQuantity - item.quantity;
        remaining += itemInfo.remainingQuantity;
      }
    }

    // Update remaining items
    await Promise.all(
      items.map(async (item) => {
        await this.prisma.itemReceiptItems.update({
          where: { id: item.id },
          data: { remainingQuantity: item.remainingQuantity },
        });
      }),
    );

    // Create receipt for received items
    const transferParam: TransferWarehouseBasedOnReceiptDto = {
      itemReceiptId: deliveryInformation.sourceDeliveryReceiptId,
      sourceWarehouseId: deliveryInformation.inTransitWarehouse.id,
      destinationWarehouseId: data.warehouseId,
      receiptTypeFrom: ItemReceiptType.IN_TRANSIT_UNLOADED,
      receiptTypeTo: ItemReceiptType.ITEM_DELIVERED,
      items: data.items,
    };

    const response =
      await this.inventoryService.transferWarehouseBasedOnReceipt(
        transferParam,
      );

    // Update delivery information
    await this.prisma.delivery.update({
      where: { id: data.deliveryId },
      data: {
        status:
          remaining > 0 ? DeliveryStatus.INCOMPLETE : DeliveryStatus.DELIVERED,
        deliveredDeliveryReceiptId: response.refillResponse.id,
      },
    });

    // Create delivery receive record
    this.prisma.deliveryReceive.create({
      data: {
        deliveryId: data.deliveryId,
        itemReceiptId: response.refillResponse.id,
      },
    });
  }
  async setStageForDelivery(data: SetStageForDeliveryDTO) {
    // Move inventory from temporary warehouse to in transit warehouse
    const temporaryWarehouse = await this.prisma.warehouse.findFirst({
      where: { warehouseType: 'TEMPORARY_WAREHOUSE' },
    });
    const deliveryInformation = await this.prisma.delivery.findUnique({
      where: { id: data.deliveryId },
    });

    if (!temporaryWarehouse) {
      throw new NotFoundException('Temporary warehouse not found');
    }

    const transferParam: TransferWarehouseBasedOnReceiptDto = {
      itemReceiptId: deliveryInformation.inTransitDeliveryReceiptId,
      sourceWarehouseId: temporaryWarehouse.id,
      destinationWarehouseId: data.warehouseId,
      receiptTypeFrom: ItemReceiptType.FOR_DELIVERY_DEDUCTION,
      receiptTypeTo: ItemReceiptType.FOR_DELIVERY_INCREMENT,
    };

    await this.inventoryService.transferWarehouseBasedOnReceipt(transferParam);

    // Update delivery information
    await this.prisma.delivery.update({
      where: { id: data.deliveryId },
      data: {
        truckLoadStage: TruckLoadStage.FOR_DELIVERY,
        inTransitWarehouse: { connect: { id: data.warehouseId } },
      },
    });
  }
  async setStage(data: any) {
    if (!data.deliveryId) {
      throw new BadRequestException('Delivery ID is required');
    }

    data.deliveryId = Number(data.deliveryId);

    const updateData = {
      truckLoadStage: data.newStage,
    };

    // If the delivery is out for delivery, set the status to pending
    if (data.newStage == 'OUT_FOR_DELIVERY') {
      updateData['status'] = 'PENDING';
    }

    await this.prisma.delivery.update({
      where: { id: data.deliveryId },
      data: updateData,
    });
  }
  async createDelivery(data: CreateDeliveryDTO) {
    const {
      sourceDeliveryReceiptId,
      deliveryDate,
      fromWarehouseId,
      toWarehouseId,
      status,
    } = data;

    const createData = {
      sourceDeliveryReceiptId,
      deliveryDate,
      fromWarehouseId,
      toWarehouseId,
      status,
      companyId: this.utility.companyId,
    };

    if (data.truckLoadStage) {
      createData['truckLoadStage'] = data.truckLoadStage;
    }

    if (data.inTransitDeliveryReceiptId) {
      createData['inTransitDeliveryReceiptId'] =
        data.inTransitDeliveryReceiptId;
    }

    if (data.inTransitWarehouseId) {
      createData['inTransitWarehouseId'] = data.inTransitWarehouseId;
    }

    if (data.pickUpLocationId) {
      createData['pickUpLocationId'] = data.pickUpLocationId;
    }

    if (data.status) {
      createData['status'] = status;
    }

    const delivery = await this.prisma.delivery.create({
      data: createData,
    });

    return delivery;
  }
  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'delivery');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      sourceDeliveryReceipt: { include: { partnerReceipt: true } },
      deliveredDeliveryReceipt: true,
      fromWarehouse: true,
      toWarehouse: true,
      inTransitWarehouse: true,
      inTransitDeliveryReceipt: true,
    };

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.delivery,
      query,
      tableQuery,
    );
    const responseList = baseList.map((delivery) =>
      this.formatDeliveryResponse(delivery),
    );

    return { list: responseList, pagination, currentPage };
  }

  /**
   * Formats a delivery response according to the standard format
   */
  private formatDeliveryResponse(delivery: any): any {
    if (!delivery) return null;

    return {
      id: delivery.id,
      sourceDeliveryReceipt: delivery.sourceDeliveryReceipt
        ? this.formatItemReceiptResponse(delivery.sourceDeliveryReceipt)
        : null,
      deliveredDeliveryReceipt: delivery.deliveredDeliveryReceipt
        ? this.formatItemReceiptResponse(delivery.deliveredDeliveryReceipt)
        : null,
      fromWarehouse: delivery.fromWarehouse
        ? this.formatWarehouseResponse(delivery.fromWarehouse)
        : null,
      toWarehouse: delivery.toWarehouse
        ? this.formatWarehouseResponse(delivery.toWarehouse)
        : null,
      inTransitWarehouse: delivery.inTransitWarehouse
        ? this.formatWarehouseResponse(delivery.inTransitWarehouse)
        : null,
      inTransitDeliveryReceipt: delivery.inTransitDeliveryReceipt
        ? this.formatItemReceiptResponse(delivery.inTransitDeliveryReceipt)
        : null,
      deliveryDate: this.utility.formatDate(delivery.deliveryDate),
      status: deliveryStatusReference.find(
        (ref) => ref.key === delivery.status,
      ) || { key: delivery.status, label: delivery.status },
      truckLoadStage: truckLoadStageReference.find(
        (ref) => ref.key === delivery.truckLoadStage,
      ) || { key: delivery.truckLoadStage, label: delivery.truckLoadStage },
      createdAt: this.utility.formatDate(delivery.createdAt),
    };
  }

  /**
   * Formats an item receipt response
   */
  private formatItemReceiptResponse(itemReceipt: any): any {
    if (!itemReceipt) return null;

    return {
      id: itemReceipt.id,
      number: itemReceipt.number,
      code: itemReceipt.code,
      type: itemReceipt.type,
      memo: itemReceipt.memo,
      itemName: itemReceipt.itemName,
      itemSku: itemReceipt.itemSku,
      itemDescription: itemReceipt.itemDescription,
      totalPayableAmount: this.utility.formatCurrency(
        itemReceipt.totalPayableAmount,
      ),
      totalSettledAmount: this.utility.formatCurrency(
        itemReceipt.totalSettledAmount,
      ),
      createdAt: this.utility.formatDate(itemReceipt.createdAt),
      updatedAt: this.utility.formatDate(itemReceipt.updatedAt),
      supplier: itemReceipt.supplier,
      warehouse: itemReceipt.warehouse,
      processedBy: itemReceipt.processedBy,
      partnerReceipt: itemReceipt.partnerReceipt,
      taxType: itemReceipt.taxType,
      paymentTerms: itemReceipt.paymentTerms,
      deliveryTerms: itemReceipt.deliveryTerms,
      delivery: itemReceipt.delivery,
      project: itemReceipt.project,
    };
  }

  /**
   * Formats a warehouse response
   */
  private formatWarehouseResponse(warehouse: any): any {
    if (!warehouse) return null;

    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      project: warehouse.project,
      size: warehouse.size,
      capacity: warehouse.capacity,
      createdAt: this.utility.formatDate(warehouse.createdAt),
      updatedAt: this.utility.formatDate(warehouse.updatedAt),
      isDeleted: warehouse.isDeleted,
      warehouseType: warehouse.warehouseType,
      isMainWarehouse: warehouse.isMainWarehouse,
    };
  }
}
