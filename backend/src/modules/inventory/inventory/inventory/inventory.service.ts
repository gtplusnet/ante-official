import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ItemReceiptType, DeliveryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import ItemReceiptTypeReference from '../../../../reference/item-receipt-type.reference';
import { ItemReceiptsService } from '@modules/inventory/receipts/item-receipts/item-receipts.service';
import { TransferWarehouseBasedOnReceiptDto } from '../../../../dto/inventory.validator';

import {
  RefillInventoryDto,
  WriteOffInventoryDto,
  ItemQuantityDto,
  TransferInventoryDto,
  TransferType,
} from '../../../../dto/inventory.validator';
import { CreateReceiptDTO } from '../../../../dto/item-receipt.dto';

@Injectable()
export class InventoryService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public itemReceiptsService: ItemReceiptsService;

  async transferWarehouseBasedOnReceipt(
    params: TransferWarehouseBasedOnReceiptDto,
  ) {
    const refReceiptTypeFrom = await this.validateItemReceiptType(
      params.receiptTypeFrom,
    );
    const refReceiptTypeTo = await this.validateItemReceiptType(
      params.receiptTypeTo,
    );

    if (refReceiptTypeFrom.itemImpact != 'deducting') {
      throw new BadRequestException(
        'Invalid receipt type from - item impact must deduct',
      );
    }

    if (refReceiptTypeTo.itemImpact != 'incrementing') {
      throw new BadRequestException(
        'Invalid receipt type to - item impact must increment',
      );
    }

    let itemsMap = [];

    // Check if items are provided in params
    if (params.items) {
      itemsMap = params.items.map((item) => {
        return {
          itemId: item.itemId,
          quantity: item.quantity,
          description: item.description,
          rate: item.rate,
        };
      });
    } else {
      const items = await this.prisma.itemReceiptItems.findMany({
        where: { itemReceiptId: params.itemReceiptId },
      });
      itemsMap = items.map((item) => {
        return {
          itemId: item.itemId,
          quantity: item.quantity,
          description: item.itemDescription,
          rate: item.unitPrice,
        };
      });
    }

    const fromData: RefillInventoryDto = {
      warehouseId: params.sourceWarehouseId,
      items: itemsMap,
      memo: 'Loaded to truck',
    };

    const toData: RefillInventoryDto = {
      warehouseId: params.destinationWarehouseId,
      items: itemsMap,
      memo: 'Loaded to truck',
    };

    // Deduct from fromWarehouse and add to inTransitWarehouse
    const deductResponse = await this.refillWriteOffInventory(
      fromData,
      params.receiptTypeFrom,
    );
    const refillResponse = await this.refillWriteOffInventory(
      toData,
      params.receiptTypeTo,
    );

    // Update partnerReceiptId
    await Promise.all([
      this.prisma.itemReceipt.update({
        where: { id: deductResponse.id },
        data: { partnerReceiptId: refillResponse.id },
      }),
      this.prisma.itemReceipt.update({
        where: { id: refillResponse.id },
        data: { partnerReceiptId: deductResponse.id },
      }),
    ]);

    return { deductResponse, refillResponse };
  }
  async transferInventory(body: TransferInventoryDto) {
    // Check if fromWarehouseId and toWarehouseId are the same
    if (body.fromWarehouseId === body.toWarehouseId) {
      throw new BadRequestException('From and to warehouse cannot be the same');
    }

    switch (body.transferType) {
      case TransferType.DELIVERY:
        return this.transferInventoryDelivery(body);
      case TransferType.DIRECT:
        return this.transferInventoryDirect(body);
      default:
        throw new BadRequestException('Invalid transfer type');
    }
  }
  async transferInventoryDelivery(body: TransferInventoryDto) {
    const fromData: RefillInventoryDto = {
      warehouseId: body.fromWarehouseId,
      items: body.items,
      memo: body.memo,
    };

    const temporaryWarehouse = await this.prisma.warehouse.findFirst({
      where: { warehouseType: 'TEMPORARY_WAREHOUSE' },
    });

    const toData: RefillInventoryDto = {
      warehouseId: temporaryWarehouse.id,
      items: body.items,
      memo: body.memo,
    };

    // Deduct from fromWarehouse and add to inTransitWarehouse
    const deductResponse = await this.refillWriteOffInventory(
      fromData,
      ItemReceiptType.TRANSFER_INVENTORY_FROM,
    );
    const refillResponse = await this.refillWriteOffInventory(
      toData,
      ItemReceiptType.RESERVED_FOR_TRANSFER,
    );

    // Update partnerReceiptId
    await Promise.all([
      this.prisma.itemReceipt.update({
        where: { id: deductResponse.id },
        data: { partnerReceiptId: refillResponse.id },
      }),
      this.prisma.itemReceipt.update({
        where: { id: refillResponse.id },
        data: { partnerReceiptId: deductResponse.id },
      }),
    ]);

    const deliveryData: Prisma.DeliveryCreateInput = {
      deliveryDate: new Date(body.deliveryDate),
      sourceDeliveryReceipt: { connect: { id: deductResponse.id } },
      inTransitDeliveryReceipt: { connect: { id: refillResponse.id } },
      fromWarehouse: { connect: { id: body.fromWarehouseId } },
      toWarehouse: { connect: { id: body.toWarehouseId } },
      status: DeliveryStatus.TRUCK_LOAD,
    };

    const deliveryResponse = await this.prisma.delivery.create({
      data: deliveryData,
    });

    return { deductResponse, refillResponse, deliveryResponse };
  }
  async transferInventoryDirect(body: TransferInventoryDto) {
    const fromData: RefillInventoryDto = {
      warehouseId: body.fromWarehouseId,
      items: body.items,
      memo: body.memo,
    };

    const toData: RefillInventoryDto = {
      warehouseId: body.toWarehouseId,
      items: body.items,
      memo: body.memo,
    };

    // Deduct from fromWarehouse and add to new warehouse
    const deductResponse = await this.refillWriteOffInventory(
      fromData,
      ItemReceiptType.TRANSFER_INVENTORY_FROM,
    );
    const refillResponse = await this.refillWriteOffInventory(
      toData,
      ItemReceiptType.TRANSFER_INVENTORY_TO,
    );

    // Update partnerReceiptId
    await Promise.all([
      this.prisma.itemReceipt.update({
        where: { id: deductResponse.id },
        data: { partnerReceiptId: refillResponse.id },
      }),
      this.prisma.itemReceipt.update({
        where: { id: refillResponse.id },
        data: { partnerReceiptId: deductResponse.id },
      }),
    ]);

    return { deductResponse, refillResponse };
  }
  async refillInventory(refillInventoryDto: RefillInventoryDto) {
    return this.refillWriteOffInventory(
      refillInventoryDto,
      ItemReceiptType.REFILL_INVENTORY,
    );
  }
  async writeOffInventory(refillInventoryDto: RefillInventoryDto) {
    return this.refillWriteOffInventory(
      refillInventoryDto,
      ItemReceiptType.WRITEOFF_INVENTORY,
    );
  }
  async refillWriteOffInventory(
    refillInventoryDto: RefillInventoryDto,
    itemReceiptType: ItemReceiptType,
  ) {
    // Check if params.type is valid from ItemReceiptTypeReference
    const receiptType = itemReceiptType;

    const type = await this.validateItemReceiptType(receiptType);

    // Check if type.module is 'inventory'
    if (type.module !== 'inventory') {
      throw new BadRequestException('Invalid item receipt type');
    }

    const { itemListInsert } = await this.createItemListForInsertion(
      refillInventoryDto.items,
    );

    // Create receipt for refill
    const createReceiptParams: CreateReceiptDTO = {
      supplierId: 0,
      warehouseId: refillInventoryDto.warehouseId,
      type: receiptType,
      memo: refillInventoryDto.memo,
      itemList: itemListInsert,
    };

    const itemReceipt: Prisma.ItemReceiptCreateInput =
      await this.itemReceiptsService.createReceiptAndItems(createReceiptParams);
    const itemReceiptResponse: any =
      this.formatPurchaseOrderResponse(itemReceipt);

    return itemReceiptResponse;
  }
  async createItemListForInsertion(itemList: ItemQuantityDto[]) {
    const data = await this.includeItemInformation(itemList);
    const totalPayableAmount = await this.computeTotalPayableAmount(data);

    const itemListInsert: Prisma.ItemReceiptItemsCreateManyInput[] = data.map(
      (item) => {
        return {
          itemReceiptId: null,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: Number(item.itemInformation.estimatedBuyingPrice),
          itemDescription: item.description,
          itemName: item.itemInformation.name.toString(),
          itemSku: item.itemInformation.sku.toString(),
          itemRate: item.rate,
          total:
            item.quantity *
            (item.rate || Number(item.itemInformation.estimatedBuyingPrice)),
        };
      },
    );

    return { itemListInsert, totalPayableAmount };
  }
  async validateItemReceiptType(type: string) {
    const typeRecord = ItemReceiptTypeReference.find(
      (item) => item.key === type,
    );

    if (!typeRecord) {
      throw new BadRequestException('Invalid item receipt type');
    }

    return typeRecord;
  }
  async computeTotalPayableAmount(itemList: ItemQuantityDto[]) {
    let totalPayableAmount = 0;
    itemList.forEach((item) => {
      totalPayableAmount += item.quantity * item.rate;
    });

    totalPayableAmount = parseFloat(totalPayableAmount.toFixed(2));

    return totalPayableAmount;
  }
  async includeItemInformation(itemList: ItemQuantityDto[]) {
    const itemPromises = itemList.map(async (item) => {
      if (!item.itemId || !item.quantity || !item.rate) {
        throw new BadRequestException('Invalid item list');
      }

      // Check if item exists
      const itemInformation: Prisma.ItemWhereUniqueInput =
        await this.prisma.item.findUnique({ where: { id: item.itemId } });

      if (!itemInformation) {
        throw new BadRequestException('Item not found');
      }

      item.itemInformation = itemInformation;

      return item;
    });

    // Wait for all item promises to resolve
    const data = await Promise.all(itemPromises);

    return data;
  }
  async getTransactionsTable(query: TableQueryDTO, body: TableBodyDTO) {
    // body.filters.push({  });
    this.tableHandlerService.initialize(query, body, 'inventoryHistory');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      item: true,
      itemReceipt: { include: { supplier: true, partnerReceipt: true } },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.itemReceiptItems,
      query,
      tableQuery,
    );
    const responseList = baseList.map((item) =>
      this.formatInventoryHistoryResponse(item),
    );

    return { list: responseList, pagination, currentPage };
  }

  async oldWriteOffInventory(_writeOffInventoryDto: WriteOffInventoryDto) {}

  async getInventory(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'inventory');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { warehouse: true, item: true };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.inventoryItem,
      query,
      tableQuery,
    );

    return { list: baseList, pagination, currentPage };
  }

  private async getParentItemTags(id: string): Promise<string[]> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: { parent: true },
    });

    let itemId = id;

    if (item?.parent) {
      itemId = item.parent;
    }

    const parentTags = await this.prisma.itemTag.findMany({
      where: { itemId },
      select: { tagId: true },
    });

    const tagKeys: string[] = [];
    for (const tag of parentTags) {
      const tagRecord = await this.prisma.tag.findUnique({
        where: { id: tag.tagId },
        select: { tagKey: true },
      });
      if (tagRecord) {
        tagKeys.push(tagRecord.tagKey);
      }
    }

    return tagKeys;
  }

  /**
   * Formats a purchase order response according to the standard format
   */
  private formatPurchaseOrderResponse(purchaseOrder: any): any {
    if (!purchaseOrder) return null;

    return {
      id: purchaseOrder.id,
      balance: this.utility.formatCurrency(purchaseOrder.balance),
      isOpen: purchaseOrder.isOpen,
      number: purchaseOrder.number,
      code: purchaseOrder.code,
      type: ItemReceiptTypeReference.find(
        (ref) => ref.key === purchaseOrder.type,
      ) || { key: purchaseOrder.type, label: purchaseOrder.type },
      memo: purchaseOrder.memo,
      totalPayableAmount: this.utility.formatCurrency(
        purchaseOrder.totalPayableAmount,
      ),
      totalSettledAmount: this.utility.formatCurrency(
        purchaseOrder.totalSettledAmount,
      ),
      createdAt: this.utility.formatDate(purchaseOrder.createdAt),
      updatedAt: this.utility.formatDate(purchaseOrder.updatedAt),
      supplier: purchaseOrder.supplier,
      warehouse: purchaseOrder.warehouse,
      taxType: purchaseOrder.taxType,
      paymentTerms: purchaseOrder.paymentTerms,
    };
  }

  /**
   * Formats an inventory history response according to the standard format
   */
  private formatInventoryHistoryResponse(inventoryHistory: any): any {
    if (!inventoryHistory) return null;

    return {
      id: inventoryHistory.id,
      itemId: inventoryHistory.itemId,
      quantity: inventoryHistory.quantity,
      quantityBefore: inventoryHistory.quantityBefore,
      quantityAfter: inventoryHistory.quantityAfter,
      unitPrice: this.utility.formatCurrency(inventoryHistory.unitPrice),
      total: this.utility.formatCurrency(inventoryHistory.total),
      itemName: inventoryHistory.itemName,
      itemSku: inventoryHistory.itemSku,
      itemRate: this.utility.formatCurrency(inventoryHistory.itemRate),
      itemDescription: inventoryHistory.itemDescription,
      item: inventoryHistory.item
        ? this.formatItemResponse(inventoryHistory.item)
        : null,
      itemReceipt: inventoryHistory.itemReceipt
        ? this.formatItemReceiptResponse(inventoryHistory.itemReceipt)
        : null,
      partnerReceipt: inventoryHistory.partnerReceipt
        ? this.formatItemReceiptResponse(inventoryHistory.partnerReceipt)
        : null,
      remainingQuantity: inventoryHistory.remainingQuantity,
    };
  }

  /**
   * Formats an item response
   */
  private formatItemResponse(item: any): any {
    if (!item) return null;

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      estimatedBuyingPrice: this.utility.formatCurrency(
        item.estimatedBuyingPrice,
      ),
      sellingPrice: this.utility.formatCurrency(item.sellingPrice),
      minimumStockLevelPrice: this.utility.formatCurrency(
        item.minimumStockLevelPrice,
      ),
      maximumStockLevelPrice: this.utility.formatCurrency(
        item.maximumStockLevelPrice,
      ),
      size: item.size,
      isVariation: item.isVariation,
      parent: item.parent,
      isDeleted: item.isDeleted,
      isDraft: item.isDraft,
      createdAt: this.utility.formatDate(item.createdAt),
      updatedAt: this.utility.formatDate(item.updatedAt),
      uom: item.uom,
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
      type: ItemReceiptTypeReference.find(
        (ref) => ref.key === itemReceipt.type,
      ) || { key: itemReceipt.type, label: itemReceipt.type },
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
}
