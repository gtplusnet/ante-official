import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  PurchaseOrderDto,
  ItemListDto,
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  SubmitSupplierSelection,
  createPaymentDto,
} from '../../../../dto/purchase-order.dto';
import { UtilityService } from '@common/utility.service';
import {
  DeliveryStatus,
  DeliveryTerms,
  ItemReceiptType,
  Prisma,
  TruckLoadStage,
  PaymentTerms,
  FundTransactionType,
  FundTransactionCode,
} from '@prisma/client';
import { ItemReceiptsService } from '@modules/inventory/receipts/item-receipts/item-receipts.service';
import ItemReceiptTypeReference from '../../../../reference/item-receipt-type.reference';
import fundAccountTypeReference from '../../../../reference/fund-account-type.reference';
import paymentTermsReference from '../../../../reference/payment-terms.reference';
import deliveryTermsReference from '../../../../reference/delivery-terms.reference';
import purchaseRequestStatusReference from '../../../../reference/purchase-request-status.reference';
import { DeliveryService } from '@modules/inventory/delivery/delivery/delivery.service';
import { CreateDeliveryDTO } from '../../../../dto/delivery.validator';
import { CreateReceiptDTO } from '../../../../dto/item-receipt.dto';
import { WarehouseType, PurchaseRequestStatus } from '@prisma/client';
import { FundAccountService } from '@modules/finance/fund-account/fund-account/fund-account.service';
import { CreateTransactionDTO } from '@modules/finance/fund-account/fund-account/fund-account.interface';

@Injectable()
export class PurchaseOrderService {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private itemReceiptsService: ItemReceiptsService;
  @Inject() private deliveryService: DeliveryService;
  @Inject() private fundAccountService: FundAccountService;

  async getPaymentHistory(purchaseOrderId: number) {
    purchaseOrderId = Number(purchaseOrderId);
    const paymentHistory = await this.prisma.purchaseOrderPayment.findMany({
      where: { purchaseOrderId },
      include: { fundAccount: true },
    });
    const formattedPurchaseOrderPayment = paymentHistory.map((payment) =>
      this.formatPurchaseOrderPaymentResponse(payment),
    );
    return formattedPurchaseOrderPayment;
  }
  async createPayment(params: createPaymentDto) {
    // Make sure payment amount and fee are numbers
    params.paymentAmount = Number(params.paymentAmount);
    params.fee = Number(params.fee);

    // Get purchase order information
    const purchaseOrderInformation = await this.prisma.purchaseOrder.findUnique(
      { where: { id: params.purchaseOrderId }, include: { itemReceipt: true } },
    );

    if (!purchaseOrderInformation) {
      throw new BadRequestException('Purchase order not found');
    }

    const fundAccountInformation =
      await this.fundAccountService.getFundAccountInfo(params.paymentAccountId);
    const totalPaymentAmount = params.paymentAmount + params.fee;

    // Check if fund account exists
    if (!fundAccountInformation) {
      throw new BadRequestException('Fund account not found');
    }

    // Check if fund account has enough balance
    if (fundAccountInformation.balance < totalPaymentAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Deduct to wallet the payment amounts
    const transactionParams: CreateTransactionDTO = {
      fundAccountId: params.paymentAccountId,
      amount: totalPaymentAmount,
      type: FundTransactionType.SUBTRACT,
      code: FundTransactionCode.PURCHASE_ORDER_PAYMENT,
      memo: `${purchaseOrderInformation.itemReceipt.code}`,
    };
    await this.fundAccountService._createTransaction(transactionParams);

    // Deduct to wallet the transaction fee
    if (params.fee > 0) {
      const transactionDeductParams: CreateTransactionDTO = {
        fundAccountId: params.paymentAccountId,
        amount: params.fee,
        type: FundTransactionType.SUBTRACT,
        code: FundTransactionCode.TRANSACTION_FEE,
        memo: `${purchaseOrderInformation.itemReceipt.code}`,
      };

      await this.fundAccountService._createTransaction(transactionDeductParams);
    }

    // Update purchase order balance
    const updatedBalance =
      purchaseOrderInformation.balance - params.paymentAmount;
    await this.prisma.purchaseOrder.update({
      where: { id: params.purchaseOrderId },
      data: { balance: updatedBalance },
    });

    // Create payment record
    await this.prisma.purchaseOrderPayment.create({
      data: {
        purchaseOrderId: params.purchaseOrderId,
        fundAccountId: params.paymentAccountId,
        amount: params.paymentAmount,
        fee: params.fee,
      },
    });

    return purchaseOrderInformation;
  }
  async submitSupplierSelection(params: SubmitSupplierSelection) {
    const supplier = {};

    // Group by supplier
    params.items.forEach((item) => {
      if (!item.supplierId) {
        throw new BadRequestException(
          'Please select a supplier for each item.',
        );
      }

      if (supplier[item.supplierId]) {
        supplier[item.supplierId].push(item);
      } else {
        supplier[item.supplierId] = [item];
      }
    });

    // get purchase request information
    const purchaseRequestInformation =
      await this.prisma.purchaseRequest.findUnique({
        where: {
          id: params.purchaseRequestId,
        },
        include: { itemReceipt: true },
      });

    const purchaseOrders = [];

    // create purchase order for reach supplier
    for (const supplierId in supplier) {
      const supplierItems = supplier[supplierId];

      // Validate item list
      const itemList: ItemListDto[] = supplierItems;
      const itemPromises = itemList.map(async (itemData) => {
        // Check if item exists
        const itemInformation: Prisma.ItemWhereUniqueInput =
          await this.prisma.item.findUnique({ where: { id: itemData.itemId } });
        const purchaseRequestItem =
          await this.prisma.itemReceiptItems.findUnique({
            where: {
              itemReceiptId_itemId: {
                itemReceiptId: purchaseRequestInformation.itemReceiptId,
                itemId: itemData.itemId,
              },
            },
          });

        if (!itemInformation) {
          throw new BadRequestException('Item not found');
        }

        itemData.itemInformation = itemInformation;
        itemData.purchaseRequestItem = purchaseRequestItem;
        return itemData;
      });

      // Wait for all item promises to resolve
      const data = await Promise.all(itemPromises);

      if (!supplier[supplierId].itemList) {
        supplier[supplierId].itemList = [];
      }

      supplier[supplierId].itemList.push(...data);
    }

    for (const supplierId in supplier) {
      // Get purchase request supplier information
      const purchaseRequestSupplierInformation =
        await this.prisma.purchaseRequestSuppliers.findUnique({
          where: {
            purchaseRequestId_supplierId: {
              purchaseRequestId: params.purchaseRequestId,
              supplierId: Number(supplierId),
            },
          },
          include: { supplier: true },
        });

      if (!purchaseRequestSupplierInformation) {
        throw new BadRequestException('Supplier not found in purchase request');
      }

      const itemList = supplier[supplierId].itemList.map((item) => {
        return {
          itemId: item.itemId,
          quantity: item.purchaseRequestItem.quantity,
          rate: item.rate,
          description: item.purchaseRequestItem.itemDescription,
        };
      });

      const purchaseOrderParams: PurchaseOrderDto = {
        supplierId: Number(supplierId),
        warehouseId: purchaseRequestInformation.itemReceipt.warehouseId,
        type: ItemReceiptType.PURCHASE_ORDER,
        memo: purchaseRequestInformation.itemReceipt.memo,
        items: itemList,
        paymentTerms: purchaseRequestSupplierInformation.paymentTerms,
        taxType: purchaseRequestSupplierInformation.supplier.taxType,
        deliveryTerms: purchaseRequestSupplierInformation.deliveryTerms,
        deliveryDate: purchaseRequestInformation.deliveryDate.toISOString(),
        projectId: purchaseRequestInformation.itemReceipt.projectId,
        pickupLocationId:
          purchaseRequestSupplierInformation.supplier.locationId,
        purchaseRequestId: params.purchaseRequestId,
      };

      await this.createPurchaseOrder(purchaseOrderParams);
    }

    // Update purchase request status
    await this.prisma.purchaseRequest.update({
      where: { id: params.purchaseRequestId },
      data: { status: PurchaseRequestStatus.PURCHASE_ORDER },
    });

    return purchaseOrders;
  }
  async updateDeliveryTerms(
    purchaseRequestId: number,
    supplierId: number,
    deliveryTerms: DeliveryTerms,
  ) {
    await this.prisma.purchaseRequestSuppliers.update({
      where: {
        purchaseRequestId_supplierId: { purchaseRequestId, supplierId },
      },
      data: { deliveryTerms },
    });
  }
  async updatePaymentTerms(
    purchaseRequestId: number,
    supplierId: number,
    paymentTerms: PaymentTerms,
  ) {
    await this.prisma.purchaseRequestSuppliers.update({
      where: {
        purchaseRequestId_supplierId: { purchaseRequestId, supplierId },
      },
      data: { paymentTerms },
    });
  }
  async getCanvass(purchaseRequestId: number) {
    purchaseRequestId = Number(purchaseRequestId);
    const purchaseRequestInformation =
      await this.prisma.purchaseRequest.findUnique({
        where: { id: purchaseRequestId },
        include: { itemReceipt: true },
      });
    const purchaseRequestItems = await this.prisma.itemReceiptItems.findMany({
      where: { itemReceiptId: purchaseRequestInformation.itemReceiptId },
      include: { item: true },
    });
    const formattedPurchaseRequestInformation =
      this.formatPurchaseRequestResponse(purchaseRequestInformation);

    // Check if purchase request and items exist
    if (!purchaseRequestInformation) {
      throw new BadRequestException('Purchase request not found');
    }

    // Check if purchase request items exist
    if (!purchaseRequestItems) {
      throw new BadRequestException('Purchase request items not found');
    }

    // Format item list
    let formattedItemList = purchaseRequestItems.map((item) =>
      this.formatReceiptItemsResponse(item),
    );

    // Get supplier for purchase request
    let supplierList = await this.prisma.purchaseRequestSuppliers.findMany({
      where: { purchaseRequestId: purchaseRequestId },
      include: { supplier: true },
      orderBy: { id: 'asc' },
    });
    supplierList = supplierList.map((supplier) =>
      this.formatPurchaseRequestSupplierResponse(supplier),
    );

    // Add details to formatted item list using map and promise
    const formattedItemListPromise = formattedItemList.map(async (item) => {
      // Get supplier price for item for each supplier
      for (const supplier of supplierList) {
        if (!item.supplierPrice) {
          item.supplierPrice = {};
        }

        item.supplierPrice[supplier.supplierId] = 0;

        const supplierItem = await this.prisma.supplierItems.findFirst({
          where: { supplierId: supplier.supplierId, itemId: item.item.id },
        });

        if (supplierItem) {
          item.supplierPrice[supplier.supplierId] =
            supplierItem.supplierPrice || 0;
        }
      }

      return item;
    });

    // Wait for all promises to resolve
    formattedItemList = await Promise.all(formattedItemListPromise);

    return {
      purchaseRequestInformation: formattedPurchaseRequestInformation,
      purchaseRequestItems: formattedItemList,
      supplierList,
    };
  }

  async addSupplierToCanvass(purchaseRequestId: number, supplierId: number) {
    const purchaseRequestInformation =
      await this.prisma.purchaseRequest.findUnique({
        where: { id: purchaseRequestId },
        include: { itemReceipt: true },
      });

    // Check if purchase request exists
    if (!purchaseRequestInformation) {
      throw new BadRequestException('Purchase request not found');
    }

    // Check if supplier exists
    const supplierInformation = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplierInformation) {
      throw new BadRequestException('Supplier not found');
    }

    // Check if supplier is already added
    const supplierExists = await this.prisma.purchaseRequestSuppliers.findFirst(
      { where: { purchaseRequestId, supplierId } },
    );

    if (supplierExists) {
      throw new BadRequestException('Supplier already added');
    }

    // Add supplier to purchase request
    await this.prisma.purchaseRequestSuppliers.create({
      data: {
        purchaseRequestId,
        supplierId,
        paymentTerms: supplierInformation.paymentTerms,
      },
    });
  }

  async deleteSupplierFromCanvass(
    purchaseRequestId: number,
    supplierId: number,
  ) {
    const purchaseRequestInformation =
      await this.prisma.purchaseRequest.findUnique({
        where: { id: purchaseRequestId },
        include: { itemReceipt: true },
      });

    // Check if purchase request exists
    if (!purchaseRequestInformation) {
      throw new BadRequestException('Purchase request not found');
    }

    // Check if supplier exists
    const supplierInformation = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplierInformation) {
      throw new BadRequestException('Supplier not found');
    }

    // Check if supplier is already added
    const supplierExists = await this.prisma.purchaseRequestSuppliers.findFirst(
      { where: { purchaseRequestId, supplierId } },
    );

    if (!supplierExists) {
      throw new BadRequestException('Supplier not found');
    }

    // Delete supplier from purchase request
    await this.prisma.purchaseRequestSuppliers.delete({
      where: {
        purchaseRequestId_supplierId: { purchaseRequestId, supplierId },
      },
    });
  }

  async updatePurchaseRequest(params: UpdatePurchaseRequestDto) {
    const updateResponse = this.prisma.purchaseRequest.update({
      where: { id: params.purchaseRequestId },
      data: { status: params.status },
    });

    return updateResponse;
  }
  async getPurchaseOrderInfo(id: number) {
    const purchaseOrder = await this.prisma.itemReceipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
      },
    });

    if (!purchaseOrder) {
      throw new BadRequestException('Purchase order not found');
    }

    const purchaseOrderResponse: any =
      this.formatPurchaseOrderResponse(purchaseOrder);
    const itemList = await this.prisma.itemReceiptItems.findMany({
      where: { itemReceiptId: id },
      include: { item: true },
    });
    const itemListRespone = itemList.map((item) =>
      this.formatPurchaseOrderItemResponse(item),
    );
    purchaseOrderResponse.itemList = itemListRespone;

    return purchaseOrderResponse;
  }
  async createPurchaseRequest(params: CreatePurchaseRequestDto) {
    // Validate item list
    let totalPayableAmount = 0;
    const itemList: ItemListDto[] = params.items;
    const itemPromises = itemList.map(async (item) => {
      if (!item.itemId || !item.quantity) {
        throw new BadRequestException('Invalid item list');
      }

      // Check if item exists
      const itemInformation: Prisma.ItemWhereUniqueInput =
        await this.prisma.item.findUnique({ where: { id: item.itemId } });

      if (!itemInformation) {
        throw new BadRequestException('Item not found');
      }

      // Validate if BOQ Item quantity purchased will exceed purchase limit
      if (item.boqKey) {
        const boqItem = await this.prisma.billOfQuantityTable.findUnique({
          where: { key: item.boqKey },
        });

        if (boqItem.quantityPurchased + item.quantity > boqItem.quantity) {
          throw new BadRequestException(
            'Item quantity exceeds purchase limit for BOQ item',
          );
        }
      }

      item.itemInformation = itemInformation;
      totalPayableAmount += item.quantity * item.rate;

      return item;
    });

    // Wait for all item promises to resolve
    const data = await Promise.all(itemPromises);

    totalPayableAmount = parseFloat(totalPayableAmount.toFixed(2));

    // Create purchase request
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
          total: item.quantity * (item.rate || item.unitPrice),
        };
      },
    );

    // Add boqTableKey to itemListInsert if billOfQuantityId is provided
    if (params.billOfQuantityId) {
      itemListInsert.forEach((item) => {
        item.boqTableKey = params.billOfQuantityId;
      });
    }

    // Create purchase request receipt
    const receiptCreateParams: CreateReceiptDTO = {
      warehouseId: params.warehouseId,
      type: ItemReceiptType.PURCHASE_REQUEST,
      memo: params.memo,
      itemList: itemListInsert,
      totalPayableAmount: totalPayableAmount,
      projectId: params.projectId,
      billOfQuantityId: params.billOfQuantityId,
    };

    const purchaseRequest =
      await this.itemReceiptsService.createReceiptAndItems(receiptCreateParams);

    // Create Purchase Request
    const purchaseRequestResponse = await this.prisma.purchaseRequest.create({
      data: {
        itemReceiptId: purchaseRequest.id,
        status: PurchaseRequestStatus.SUPPLIER_OUTSOURCING,
        deliveryDate: params.deliveryDate,
      },
    });

    // Update BOQ purchase quantity per item
    await Promise.all(
      data.map(async (item) => {
        if (!item.boqKey) {
          return;
        }

        await this.prisma.billOfQuantityTable.update({
          where: { key: item.boqKey },
          data: { quantityPurchased: { increment: item.quantity } },
        });
      }),
    );

    return purchaseRequestResponse;
  }
  async createPurchaseOrder(params: PurchaseOrderDto) {
    // Check if params.type is valid from ItemReceiptTypeReference
    const type = ItemReceiptTypeReference.find(
      (item) => item.key === params.type,
    );
    if (!type) {
      throw new BadRequestException('Invalid item receipt type');
    }

    // Check if type.module is 'purchase-order'
    if (type.module !== 'purchase-order') {
      throw new BadRequestException('Invalid item receipt type');
    }

    // Validate item list
    let totalPayableAmount = 0;
    const itemList: ItemListDto[] = params.items;
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
      totalPayableAmount += item.quantity * item.rate;

      return item;
    });

    // Wait for all item promises to resolve
    const data = await Promise.all(itemPromises);

    totalPayableAmount = parseFloat(totalPayableAmount.toFixed(2));

    // Create purchase order
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
          total: item.quantity * (item.rate || item.unitPrice),
        };
      },
    );

    // Get temporary warehouse
    const temporaryWarehouse = await this.prisma.warehouse.findFirst({
      where: { warehouseType: WarehouseType.TEMPORARY_WAREHOUSE },
    });

    // Create purchase order
    const receiptCreateParams: CreateReceiptDTO = {
      supplierId: params.supplierId,
      warehouseId: temporaryWarehouse.id,
      type: ItemReceiptType.PURCHASE_ORDER,
      memo: params.memo,
      itemList: itemListInsert,
      paymentTerms: params.paymentTerms,
      taxType: params.taxType,
      deliveryTerms: params.deliveryTerms,
      totalPayableAmount: totalPayableAmount,
    };

    const purchaseOrder =
      await this.itemReceiptsService.createReceiptAndItems(receiptCreateParams);

    // Create delivery
    const deliveryData: CreateDeliveryDTO = {
      sourceDeliveryReceiptId: purchaseOrder.id,
      deliveryDate: new Date(params.deliveryDate),
      fromWarehouseId: null,
      toWarehouseId: params.warehouseId,
      inTransitWarehouseId: temporaryWarehouse.id,
      inTransitDeliveryReceiptId: purchaseOrder.id,
      status:
        params.deliveryTerms == DeliveryTerms.DELIVERY
          ? DeliveryStatus.PENDING
          : DeliveryStatus.FOR_PICKUP,
      truckLoadStage:
        params.deliveryTerms == DeliveryTerms.DELIVERY
          ? TruckLoadStage.FOR_SECURING
          : TruckLoadStage.FOR_LOADING,
    };

    if (params.pickupLocationId) {
      deliveryData.pickUpLocationId = params.pickupLocationId;
    }

    const deliveryInformation =
      await this.deliveryService.createDelivery(deliveryData);

    await this.itemReceiptsService.setDeliveryId(
      purchaseOrder.id,
      deliveryInformation.id,
    );
    await this.itemReceiptsService.setProjectId(
      purchaseOrder.id,
      params.projectId,
    );

    // Add purchase order record
    const purchaseOrderParams = {
      itemReceiptId: purchaseOrder.id,
      balance: totalPayableAmount,
    };
    if (params.purchaseRequestId) {
      purchaseOrderParams['purchaseRequestId'] = params.purchaseRequestId;
    }

    // Create purchase order record
    await this.prisma.purchaseOrder.create({
      data: purchaseOrderParams,
    });

    return deliveryInformation;
  }

  /**
   * Formats a purchase order payment response according to the standard format
   */
  private formatPurchaseOrderPaymentResponse(payment: any): any {
    if (!payment) return null;

    return {
      purchaseOrder: payment.purchaseOrder
        ? this.formatPurchaseOrderResponse(payment.purchaseOrder)
        : null,
      fundAccount: payment.fundAccount
        ? this.formatFundAccountResponse(payment.fundAccount)
        : null,
      amount: this.utility.formatCurrency(payment.amount),
      fee: this.utility.formatCurrency(payment.fee),
      createdAt: this.utility.formatDate(payment.createdAt),
    };
  }

  /**
   * Formats a purchase request response
   */
  private formatPurchaseRequestResponse(purchaseRequest: any): any {
    if (!purchaseRequest) return null;

    return {
      id: purchaseRequest.id,
      itemReceipt: purchaseRequest.itemReceipt
        ? this.formatItemReceiptResponse(purchaseRequest.itemReceipt)
        : null,
      itemReceiptId: purchaseRequest.itemReceiptId,
      status: purchaseRequestStatusReference.find(
        (ref) => ref.key === purchaseRequest.status,
      ) || { key: purchaseRequest.status, label: purchaseRequest.status },
      deliveryDate: this.utility.formatDate(purchaseRequest.deliveryDate),
    };
  }

  /**
   * Formats a receipt items response
   */
  private formatReceiptItemsResponse(item: any): any {
    if (!item) return null;

    return {
      itemName: item.itemName,
      itemSku: item.itemSku,
      itemDescription: item.itemDescription,
      itemRate: this.utility.formatCurrency(item.itemRate),
      quantity: item.quantity,
      unitPrice: this.utility.formatCurrency(item.unitPrice),
      total: this.utility.formatCurrency(item.total),
      item: item.item ? this.formatItemResponse(item.item) : null,
    };
  }

  /**
   * Formats a purchase request supplier response
   */
  private formatPurchaseRequestSupplierResponse(supplier: any): any {
    if (!supplier) return null;

    return {
      id: supplier.id,
      purchaseRequestId: supplier.purchaseRequestId,
      supplierId: supplier.supplierId,
      paymentTerms: paymentTermsReference.find(
        (ref) => ref.key === supplier.paymentTerms,
      ) || { key: supplier.paymentTerms, label: supplier.paymentTerms },
      deliveryTerms: deliveryTermsReference.find(
        (ref) => ref.key === supplier.deliveryTerms,
      ) || { key: supplier.deliveryTerms, label: supplier.deliveryTerms },
      supplier: supplier.supplier
        ? this.formatSupplierResponse(supplier.supplier)
        : null,
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
      supplier: purchaseOrder.supplier
        ? this.formatSupplierResponse(purchaseOrder.supplier)
        : null,
      warehouse: purchaseOrder.warehouse
        ? this.formatWarehouseResponse(purchaseOrder.warehouse)
        : null,
      taxType: purchaseOrder.taxType,
      paymentTerms: purchaseOrder.paymentTerms,
    };
  }

  /**
   * Formats a purchase order item response
   */
  private formatPurchaseOrderItemResponse(item: any): any {
    if (!item) return null;

    return {
      id: item.id,
      item: item.item ? this.formatItemResponse(item.item) : null,
      quantity: item.quantity,
      unitPrice: this.utility.formatCurrency(item.unitPrice),
      total: this.utility.formatCurrency(item.total),
    };
  }

  /**
   * Formats a fund account response
   */
  private formatFundAccountResponse(fundAccount: any): any {
    if (!fundAccount) return null;

    return {
      id: fundAccount.id,
      name: fundAccount.name,
      description: fundAccount.description,
      accountNumber: fundAccount.accountNumber,
      type: fundAccountTypeReference.find(
        (ref) => ref.key === fundAccount.type,
      ) || { key: fundAccount.type, label: fundAccount.type },
      balance: this.utility.formatCurrency(fundAccount.balance),
      createdAt: this.utility.formatDate(fundAccount.createdAt),
      updatedAt: this.utility.formatDate(fundAccount.updatedAt),
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
}
