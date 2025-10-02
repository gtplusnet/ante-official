import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Prisma, ItemReceipt } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import itemReceiptTypeReference from '../../../../reference/item-receipt-type.reference';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { CreateReceiptDTO } from '../../../../dto/item-receipt.dto';
import DeliveryStatusReference from '../../../../reference/delivery-status.reference';
import purchaseRequestStatusReference from '../../../../reference/purchase-request-status.reference';
import paymentTermsReference from '../../../../reference/payment-terms.reference';
import deliveryTermsReference from '../../../../reference/delivery-terms.reference';
import taxTypeReference from '../../../../reference/tax-type.reference';

@Injectable()
export class ItemReceiptsService {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private tableHandler: TableHandlerService;

  async increaseTotalSettledAmount(itemReceiptId: number, amount: number) {
    const itemReceipt = await this.prisma.itemReceipt.findUnique({
      where: { id: itemReceiptId },
    });

    if (!itemReceipt) {
      throw new BadRequestException('Item receipt not found');
    }

    await this.prisma.itemReceipt.update({
      where: { id: itemReceiptId },
      data: { totalSettledAmount: itemReceipt.totalSettledAmount + amount },
    });
  }

  async getItemReceiptInfo(id: number) {
    id = Number(id);
    const itemReceiptInfo = await this.prisma.itemReceipt.findUnique({
      where: { id },
    });

    // Check if item receipt exists
    if (!itemReceiptInfo) {
      throw new BadRequestException('Item receipt not found');
    }

    const itemReceiptType = itemReceiptTypeReference.find(
      (item) => item.key === itemReceiptInfo.type,
    );
    const itemReceiptItemList = await this.prisma.itemReceiptItems.findMany({
      where: { itemReceiptId: id },
    });
    let responseItemReceiptInfo =
      this.formatItemReceiptResponse(itemReceiptInfo);
    const responseItemReceiptItemList = itemReceiptItemList.map((item) =>
      this.formatInventoryHistoryResponse(item),
    );

    responseItemReceiptInfo = await this._additionalResponse(
      responseItemReceiptInfo,
    );

    const response = {
      itemReceiptInfo: responseItemReceiptInfo,
      itemReceiptType,
      itemReceiptItemList: responseItemReceiptItemList,
    };

    return response;
  }
  async setProjectId(itemReceiptId: number, projectId: number) {
    const itemReceipt = await this.prisma.itemReceipt.findUnique({
      where: { id: itemReceiptId },
    });

    if (!itemReceipt) {
      throw new BadRequestException('Item receipt not found');
    }

    // Check if project exists then update item receipt
    if (projectId) {
      await this.prisma.itemReceipt.update({
        where: { id: itemReceiptId },
        data: { projectId },
      });
    }
  }
  async setDeliveryId(itemReceiptId: number, deliveryId: number) {
    const itemReceipt = await this.prisma.itemReceipt.findUnique({
      where: { id: itemReceiptId },
    });

    if (!itemReceipt) {
      throw new BadRequestException('Item receipt not found');
    }

    await this.prisma.itemReceipt.update({
      where: { id: itemReceiptId },
      data: { deliveryId },
    });
  }
  async getItemReceiptTable(query: TableQueryDTO, body: TableBodyDTO) {
    let itemReceiptTableFormat = 'itemReceipt';

    if (query.hasOwnProperty('format') && query.format) {
      itemReceiptTableFormat = query.format;
    }

    const typeFilter =
      body.filters.find((filter) => 'type' in filter)?.type || null;

    this.tableHandler.initialize(query, body, itemReceiptTableFormat);
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';

    if (typeFilter) {
      tableQuery['where']['type'] = { in: typeFilter };
    }

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
    };

    tableQuery['include'] = {
      supplier: true,
      warehouse: true,
      delivery: true,
      project: true,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.itemReceipt,
      query,
      tableQuery,
    );
    let list = baseList.map((itemReceipt) =>
      this.formatItemReceiptResponse(itemReceipt),
    );

    list = await Promise.all(
      list.map(async (item) => {
        item = await this._additionalResponse(item);
        return item;
      }),
    );

    return { list, pagination, currentPage };
  }
  async _additionalResponse(item) {
    // Fetch purchase request if item type is 'PURCHASE_REQUEST'
    if (item.type.key === 'PURCHASE_REQUEST') {
      const forDeliveyStatus = DeliveryStatusReference.find(
        (status) => status.key === 'PENDING',
      );
      const purchaseRequest = await this.prisma.purchaseRequest.findFirst({
        where: { itemReceiptId: item.id },
        include: {
          PurchaseOrder: {
            include: { itemReceipt: { include: { delivery: true } } },
          },
        },
      });
      const purchaseOrderStatus = {
        paymentStatus: 'Unpaid',
        paymentPercentage: 0,
        deliveryStatus: forDeliveyStatus,
        deliveryPercentage: 0,
      };
      let totalPayable = 0;
      let totalBalance = 0;

      if (!purchaseRequest) {
        await this.prisma.itemReceipt.delete({ where: { id: item.id } });
      }

      if (purchaseRequest.PurchaseOrder.length > 0) {
        let level = 0;
        purchaseRequest.PurchaseOrder.forEach((order) => {
          if (order.itemReceipt.delivery) {
            const deliveryStatus = order.itemReceipt.delivery.status;
            const deliveryStatusReference = DeliveryStatusReference.find(
              (status) => status.key === deliveryStatus,
            );

            if (
              deliveryStatusReference &&
              deliveryStatusReference.level > level
            ) {
              level = deliveryStatusReference.level;
              purchaseOrderStatus.deliveryStatus = deliveryStatusReference;
            }
          }

          totalPayable += order.itemReceipt.totalPayableAmount || 0;
          totalBalance += order.balance || 0;
        });

        // Purchase request validation passed
      }

      purchaseOrderStatus.paymentPercentage =
        totalPayable > 0
          ? ((totalPayable - totalBalance) / totalPayable) * 100
          : 0;

      // Set payment status
      if (purchaseOrderStatus.paymentPercentage === 100) {
        purchaseOrderStatus.paymentStatus = 'Paid';
      } else if (purchaseOrderStatus.paymentPercentage > 0) {
        purchaseOrderStatus.paymentStatus = 'Partially Paid';
      }

      item['purchaseOrderStatus'] = purchaseOrderStatus;
      item['purchaseRequest'] =
        this.formatPurchaseRequestResponse(purchaseRequest);
    }

    // Fetch purchase order if item type is 'PURCHASE_ORDER'
    if (item.type.key === 'PURCHASE_ORDER') {
      const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
        where: { itemReceiptId: item.id },
      });
      if (purchaseOrder) {
        item['purchaseOrder'] = this.formatPurchaseOrderResponse(purchaseOrder);
      } else {
        // Provide default purchase order object with formatted values
        item['purchaseOrder'] = {
          id: null,
          balance: this.utility.formatCurrency(0),
          isOpen: false,
        };
      }
    }
    return item;
  }
  async createReceiptAndItems(params: CreateReceiptDTO) {
    const itemReceiptType = itemReceiptTypeReference.find(
      (item) => item.key === params.type,
    );

    // check total if isNan on params.itemList then covert to zero
    params.itemList = params.itemList.map((item) => {
      if (isNaN(item.total)) {
        item.total = 0;
      }
      return item;
    });

    params.totalPayableAmount = params.itemList.reduce(
      (acc, item) => acc + item.total,
      0,
    );
    params.itemTotalCount = params.itemList.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    await this.validateItemList(
      params.warehouseId,
      itemReceiptType.itemImpact,
      params.itemList,
    );

    const itemReceipt: Prisma.ItemReceiptUncheckedCreateInput =
      await this.createReceipts(params);
    // Fetch warehouse item quantity
    const itemListInsert = await Promise.all(
      params.itemList.map(async (item) => {
        const inventoryInformation = await this.prisma.inventoryItem.findFirst({
          where: { itemId: item.itemId, warehouseId: params.warehouseId },
        });

        return {
          ...item,
          itemReceiptId: itemReceipt.id,
          quantityBefore: inventoryInformation
            ? inventoryInformation.stockCount
            : 0,
          quantityAfter: inventoryInformation
            ? inventoryInformation.stockCount
            : 0,
        };
      }),
    );

    await this.createItemReceiptItems(itemListInsert);

    // Update inventory if itemImpact is 'deducting' or 'incrementing'
    if (
      itemReceiptType.itemImpact === 'deducting' ||
      itemReceiptType.itemImpact === 'incrementing'
    ) {
      await this.updateInventory(itemReceipt.id, itemReceiptType.itemImpact);
    }

    return itemReceipt;
  }

  private async validateItemList(
    warehouseId: string,
    itemImpact: string,
    itemList: Prisma.ItemReceiptItemsCreateManyInput[],
  ) {
    const itemPromises = itemList.map(async (item) => {
      const itemInformation = await this.prisma.item.findUnique({
        where: { id: item.itemId },
      });
      const inventoryInformation = await this.prisma.inventoryItem.findFirst({
        where: { itemId: item.itemId, warehouseId },
      });

      // check repeated itemId in itemList
      const repeatedItem = itemList.filter(
        (itemList) => itemList.itemId === item.itemId,
      );
      if (repeatedItem.length > 1) {
        throw new BadRequestException(
          `Item ${itemInformation.name} (${itemInformation.sku}) is repeated`,
        );
      }

      if (!itemInformation) {
        throw new BadRequestException('Item not found');
      }

      if (
        itemImpact === 'deducting' &&
        (!inventoryInformation ||
          inventoryInformation.stockCount < item.quantity)
      ) {
        throw new BadRequestException(
          `Insufficient stock for ${itemInformation.name} (${itemInformation.sku})`,
        );
      }
    });

    await Promise.all(itemPromises);
  }
  private async createReceipts(
    params: CreateReceiptDTO,
  ): Promise<Prisma.ItemReceiptUncheckedCreateInput> {
    const itemReceiptType = itemReceiptTypeReference.find(
      (item) => item.key === params.type,
    );
    const lastData = await this.prisma.itemReceipt.findFirst({
      where: { type: params.type },
      orderBy: { id: 'desc' },
    });
    const lastNumber = lastData ? lastData.number : 0;
    const code =
      itemReceiptType.abb + '-' + (lastNumber + 1).toString().padStart(4, '0');

    // Create item receipt
    const createParams: Prisma.ItemReceiptCreateInput = {
      number: lastNumber + 1,
      code: code,
      type: params.type,
      memo: params.memo,
      totalPayableAmount: params.totalPayableAmount,
      warehouse: { connect: { id: params.warehouseId } },
      deliveryTerms: params.deliveryTerms,
      itemTotalCount: Number(params.itemTotalCount),
      company: { connect: { id: this.utility.companyId } },
      processedBy: this.utility.accountInformation
        ? this.utility.accountInformation.firstName +
          ' ' +
          this.utility.accountInformation.lastName
        : 'System',
    };

    // Add optional parameters
    if (params.billOfQuantityId) {
      createParams['billOfQuantity'] = {
        connect: { id: params.billOfQuantityId },
      };
    }

    if (params.paymentTerms) {
      createParams['paymentTerms'] = params.paymentTerms;
    }

    if (params.taxType) {
      createParams['taxType'] = params.taxType;
    }

    if (params.supplierId) {
      createParams['supplier'] = { connect: { id: params.supplierId } };
    }

    if (params.projectId) {
      createParams['project'] = { connect: { id: params.projectId } };
    }

    const itemReceipt: ItemReceipt = await this.prisma.itemReceipt.create({
      data: createParams,
    });

    return itemReceipt;
  }
  private async createItemReceiptItems(
    itemListInsert: Prisma.ItemReceiptItemsCreateManyInput[],
  ) {
    // Set remaining quantity to quantity
    itemListInsert = itemListInsert.map((item) => {
      item.quantity = Number(item.quantity);
      item.remainingQuantity = Number(item.quantity);
      return item;
    });

    await this.prisma.itemReceiptItems.createMany({ data: itemListInsert });
  }
  private async updateInventory(itemReceiptId: number, itemImpact: string) {
    const itemReceiptInformation = await this.prisma.itemReceipt.findUnique({
      where: { id: itemReceiptId },
    });
    const itemList: Prisma.ItemReceiptItemsCreateManyInput[] =
      await this.prisma.itemReceiptItems.findMany({ where: { itemReceiptId } });

    // Update inventory
    const updatePromises = itemList.map(async (item) => {
      const itemInformation = await this.prisma.item.findUnique({
        where: { id: item.itemId },
      });

      if (!itemInformation) {
        throw new BadRequestException('Item not found');
      }

      const inventoryInformation = await this.prisma.inventoryItem.findFirst({
        where: {
          itemId: item.itemId,
          warehouseId: itemReceiptInformation.warehouseId,
        },
      });
      let quantity = 0;
      let cost = 0;

      if (inventoryInformation) {
        quantity = inventoryInformation.stockCount;
        cost = inventoryInformation.stockCostCount;
      }

      // Deduct or increment quantity based on itemImpact
      if (itemImpact === 'deducting') {
        quantity -= item.quantity;
        cost -= item.unitPrice * item.quantity;
      } else if (itemImpact === 'incrementing') {
        quantity += item.quantity;
        cost += item.unitPrice * item.quantity;
      }

      if (quantity < 0) {
        throw new BadRequestException(
          'Insufficient stock for' + itemInformation.name,
        );
      }

      await this.prisma.inventoryItem.upsert({
        where: {
          warehouseId_itemId: {
            warehouseId: itemReceiptInformation.warehouseId,
            itemId: item.itemId,
          },
        },
        update: {
          stockCount: quantity,
          stockCostCount: cost,
        },
        create: {
          stockCount: quantity,
          itemId: item.itemId,
          warehouseId: itemReceiptInformation.warehouseId,
        },
      });

      // Update item receipt item quantityAfter
      await this.prisma.itemReceiptItems.update({
        where: { id: item.id },
        data: { quantityAfter: quantity },
      });

      // Create Logs
      this.utility.log(
        `Item ${itemInformation.name} ${itemImpact === 'deducting' ? 'deducted' : 'incremented'} by ${item.quantity} in warehouse ${itemReceiptInformation.warehouseId}`,
      );
    });

    await Promise.all(updatePromises);

    // Update item receipt status
    await this.prisma.itemReceipt.update({
      where: { id: itemReceiptId },
      data: { isItemInventoryPosted: true },
    });
  }

  /**
   * Formats an item receipt response according to the standard format
   */
  private formatItemReceiptResponse(itemReceipt: any): any {
    if (!itemReceipt) return null;

    return {
      id: itemReceipt.id,
      number: itemReceipt.number,
      code: itemReceipt.code,
      type: itemReceiptTypeReference.find(
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
      supplier: itemReceipt.supplier
        ? this.formatSupplierResponse(itemReceipt.supplier)
        : null,
      warehouse: itemReceipt.warehouse
        ? this.formatWarehouseResponse(itemReceipt.warehouse)
        : null,
      processedBy: itemReceipt.processedBy,
      partnerReceipt: itemReceipt.partnerReceipt
        ? this.formatItemReceiptResponse(itemReceipt.partnerReceipt)
        : null,
      taxType: taxTypeReference.find(
        (ref) => ref.key === itemReceipt.taxType,
      ) || { key: itemReceipt.taxType, label: itemReceipt.taxType },
      paymentTerms: paymentTermsReference.find(
        (ref) => ref.key === itemReceipt.paymentTerms,
      ) || { key: itemReceipt.paymentTerms, label: itemReceipt.paymentTerms },
      deliveryTerms: deliveryTermsReference.find(
        (ref) => ref.key === itemReceipt.deliveryTerms,
      ) || { key: itemReceipt.deliveryTerms, label: itemReceipt.deliveryTerms },
      delivery: itemReceipt.delivery
        ? this.formatDeliveryResponse(itemReceipt.delivery)
        : null,
      project: itemReceipt.project
        ? this.formatProjectResponse(itemReceipt.project)
        : null,
      isItemInventoryPosted: itemReceipt.isItemInventoryPosted || false,
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
      item: inventoryHistory.item,
      itemReceipt: inventoryHistory.itemReceipt,
      partnerReceipt: inventoryHistory.partnerReceipt,
      remainingQuantity: inventoryHistory.remainingQuantity,
    };
  }

  /**
   * Formats a purchase request response
   */
  private formatPurchaseRequestResponse(purchaseRequest: any): any {
    if (!purchaseRequest) return null;

    return {
      id: purchaseRequest.id,
      itemReceipt: purchaseRequest.itemReceipt,
      itemReceiptId: purchaseRequest.itemReceiptId,
      status: purchaseRequestStatusReference.find(
        (ref) => ref.key === purchaseRequest.status,
      ) || { key: purchaseRequest.status, label: purchaseRequest.status },
      deliveryDate: this.utility.formatDate(purchaseRequest.deliveryDate),
    };
  }

  /**
   * Formats a purchase order response
   */
  private formatPurchaseOrderResponse(purchaseOrder: any): any {
    if (!purchaseOrder) return null;

    return {
      id: purchaseOrder.id,
      balance: this.utility.formatCurrency(purchaseOrder.balance),
      isOpen: purchaseOrder.isOpen,
      number: purchaseOrder.number,
      code: purchaseOrder.code,
      type: purchaseOrder.type,
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
   * Formats a supplier response
   */
  private formatSupplierResponse(supplier: any): any {
    if (!supplier) return null;

    return {
      id: supplier.id,
      name: supplier.name,
      contactNumber: supplier.contactNumber,
      email: supplier.email,
      taxType: supplier.taxType,
      paymentTerms: supplier.paymentTerms,
      location: supplier.location,
      isDeleted: supplier.isDeleted,
      createdAt: this.utility.formatDate(supplier.createdAt),
      updatedAt: this.utility.formatDate(supplier.updatedAt),
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

  /**
   * Formats a delivery response
   */
  private formatDeliveryResponse(delivery: any): any {
    if (!delivery) return null;

    return {
      id: delivery.id,
      sourceDeliveryReceipt: delivery.sourceDeliveryReceipt,
      deliveredDeliveryReceipt: delivery.deliveredDeliveryReceipt,
      fromWarehouse: delivery.fromWarehouse,
      toWarehouse: delivery.toWarehouse,
      inTransitWarehouse: delivery.inTransitWarehouse,
      inTransitDeliveryReceipt: delivery.inTransitDeliveryReceipt,
      deliveryDate: this.utility.formatDate(delivery.deliveryDate),
      status: delivery.status,
      truckLoadStage: delivery.truckLoadStage,
      createdAt: this.utility.formatDate(delivery.createdAt),
    };
  }

  /**
   * Formats a project response
   */
  private formatProjectResponse(project: any): any {
    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      budget: this.utility.formatCurrency(project.budget),
      address: project.address,
      isDeleted: project.isDeleted,
      startDate: this.utility.formatDate(project.startDate),
      endDate: this.utility.formatDate(project.endDate),
      status: project.status,
      isLead: project.isLead,
      location: project.location,
      client: project.client,
      downpaymentAmount: this.utility.formatCurrency(project.downpaymentAmount),
      retentionAmount: this.utility.formatCurrency(project.retentionAmount),
      totalCollection: this.utility.formatCurrency(project.totalCollection),
      totalCollectionBalance: this.utility.formatCurrency(
        project.totalCollectionBalance,
      ),
      totalCollected: this.utility.formatCurrency(project.totalCollected),
      progressPercentage: project.progressPercentage,
      isProjectStarted: project.isProjectStarted,
      winProbability: project.winProbability,
      personInCharge: project.personInCharge,
    };
  }
}
