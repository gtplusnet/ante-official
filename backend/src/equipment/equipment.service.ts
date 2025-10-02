import { BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import {
  EquipmentCreateDTO,
  EquipmentItemCreateDTO,
  EquipmentMaintenanceCreateDTO,
  EquipmentPartCreateDTO,
  EquipmentPartsSetNextMaintenanceDate,
} from './equipment.interface';
import { EquipmentParts, Prisma } from '@prisma/client';
import { PurchaseOrderService } from '@modules/finance/purchase-order/purchase-order/purchase-order.service';
import {
  CreatePurchaseRequestDto,
  ItemListDto,
} from '../dto/purchase-order.dto';
import RepairStageReference from '../reference/repair-stage.reference';
import { WarehouseService } from '@modules/inventory/warehouse/warehouse/warehouse.service';
import { WarehouseCreateDTO } from '../dto/warehouse.validator';

export class EquipmentService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public purchaseOrderService: PurchaseOrderService;
  @Inject() public warehouseService: WarehouseService;

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'equipment');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { currentWarehouse: true, brand: true };
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.equipment,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((equipment) =>
      this.formatEquipmentResponse(equipment),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async getMaintenanceHistoryTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(
      query,
      body,
      'equipmentPartsMaintenanceHistory',
    );
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['include'] = {
      equipmentParts: { include: { equipment: true } },
      maintenanceProof: true,
      checkedBy: true,
      repairItemPurchaseRequest: { include: { itemReceipt: true } },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.equipmentPartsMaintenanceHistory,
      query,
      tableQuery,
    );

    const baseListMapped = await Promise.all(
      baseList.map(
        async (history: {
          repairItemPurchaseRequest?: any;
          repairStage?: string;
        }) => {
          const purchaseRequestInformation = history.repairItemPurchaseRequest;

          if (
            purchaseRequestInformation &&
            history.repairStage == 'PENDING_REPAIR'
          ) {
            history.repairStage = 'PURCHASE_REQUEST';

            if (purchaseRequestInformation.status == 'PURCHASE_ORDER') {
              // get purchase orders from purchase request
              const purchaseOrderList =
                await this.prisma.purchaseOrder.findMany({
                  where: { purchaseRequestId: purchaseRequestInformation.id },
                  include: { itemReceipt: { include: { delivery: true } } },
                });
              let isPendingDelivery = false;

              for (const purchaseOrder of purchaseOrderList) {
                const deliveryInformation = purchaseOrder.itemReceipt.delivery;
                if (deliveryInformation.status != 'DELIVERED') {
                  isPendingDelivery = true;
                  break;
                }
              }

              if (isPendingDelivery) {
                history.repairStage = 'PENDING_DELIVERY';
              } else {
                history.repairStage = 'PENDING_REPAIR';
              }
            }
          }

          return history;
        },
      ),
    );

    const formattedList = baseListMapped.map((history) =>
      this.formatMaintenanceHistoryResponse(history),
    );
    return { list: formattedList, pagination, currentPage };
  }
  async getPartsTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'equipmentParts');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['include'] = { equipment: true };
    tableQuery['where'] = {
      ...tableQuery['where'],
      equipment: {
        companyId: this.utilityService.companyId,
      },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.equipmentParts,
      query,
      tableQuery,
    );

    await Promise.all(
      baseList.map(async (part: EquipmentParts) => {
        const items = await this.prisma.equipmentPartsItem.findMany({
          where: { equipmentPartsId: part.id },
        });
        part['itemsCount'] = items.length;
      }),
    );

    const formattedList = baseList.map((part) =>
      this.formatEquipmentPartsResponse(part),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async getParts(id) {
    const parts = await this.prisma.equipmentParts.findMany({
      where: { equipmentId: id },
    });

    // count items inside parts
    await Promise.all(
      parts.map(async (part) => {
        const items = await this.prisma.equipmentPartsItem.findMany({
          where: { equipmentPartsId: part.id },
        });
        part['itemsCount'] = items.length;
      }),
    );

    const partsFormatted = parts.map((part) =>
      this.formatEquipmentPartsResponse(part),
    );
    return partsFormatted;
  }
  async savePartsItems(body: EquipmentItemCreateDTO) {
    const checkExist = await this.prisma.equipmentPartsItem.findUnique({
      where: {
        equipmentPartsId_itemId: {
          equipmentPartsId: body.partId,
          itemId: body.itemId,
        },
      },
    });
    const quantity = body.quantity;

    if (checkExist) {
      await this.prisma.equipmentPartsItem.update({
        where: {
          equipmentPartsId_itemId: {
            equipmentPartsId: body.partId,
            itemId: body.itemId,
          },
        },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await this.prisma.equipmentPartsItem.create({
        data: {
          equipmentPartsId: body.partId,
          itemId: body.itemId,
          quantity: quantity,
        },
      });
    }
  }
  async deletePartsItems(id: number) {
    await this.prisma.equipmentPartsItem.delete({ where: { id } });
  }
  async getPartsItems(partId: number) {
    const partsItems = await this.prisma.equipmentPartsItem.findMany({
      where: {
        equipmentPartsId: partId,
      },
      include: {
        item: true,
      },
    });
    return partsItems;
  }
  async deleteParts(id) {
    await this.prisma.equipmentParts.delete({ where: { id } });
  }
  async getEquipmentData(id) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        currentWarehouse: true,
        brand: true,
      },
    });

    const formattedEquipment = this.formatEquipmentResponse(equipment);

    return { equipmentData: formattedEquipment };
  }

  private formatEquipmentResponse(equipment: any): any {
    if (!equipment) return null;

    return {
      id: equipment.id,
      name: equipment.name,
      serialCode: equipment.serialCode,
      equipmentType: equipment.equipmentType,
      brandId: equipment.brandId,
      currentWarehouseId: equipment.currentWarehouseId,
      createdAt: this.utilityService.formatDate(equipment.createdAt),
      currentWarehouse: equipment.currentWarehouse,
      brand: equipment.brand,
    };
  }

  private formatEquipmentPartsResponse(part: any): any {
    if (!part) return null;

    return {
      id: part.id,
      partName: part.partName,
      scheduleDay: part.scheduleDay,
      lastMaintenanceDate: this.utilityService.formatDate(
        part.lastMaintenanceDate,
      ),
      nextMaintenanceDate: this.utilityService.formatDate(
        part.nextMaintenanceDate,
      ),
      equipment: part.equipment,
      itemsCount: part.itemsCount || 0,
      createdAt: this.utilityService.formatDate(part.createdAt),
    };
  }

  private formatMaintenanceHistoryResponse(history: any): any {
    if (!history) return null;

    return {
      id: history.id,
      maintenanceDate: this.utilityService.formatDate(history.maintenanceDate),
      isWorking: history.isWorking,
      repairStage: RepairStageReference.find(
        (ref) => ref.key === history.repairStage,
      ) || { key: history.repairStage, label: history.repairStage },
      equipmentParts: history.equipmentParts,
      maintenanceProof: history.maintenanceProof,
      checkedBy: history.checkedBy,
      repairItemPurchaseRequest: history.repairItemPurchaseRequest,
      createdAt: this.utilityService.formatDate(history.createdAt),
    };
  }
  async saveEquipment(body: EquipmentCreateDTO) {
    const equipmentCreateParams: Prisma.EquipmentCreateInput = {
      name: body.name,
      serialCode: body.serialCode,
      brand: { connect: { id: body.brandId } },
      currentWarehouse: { connect: { id: body.currentWarehouseId } },
      equipmentType: body.equipmentType,
      company: { connect: { id: this.utilityService.companyId } },
    };

    let equipment;

    if (body.id) {
      equipment = await this.prisma.equipment.update({
        where: { id: body.id },
        data: equipmentCreateParams,
      });
    } else {
      equipment = await this.prisma.equipment.create({
        data: equipmentCreateParams,
      });
    }

    // create in transit warehouse if vehicle
    const location = await this.prisma.warehouse.findUnique({
      where: { id: body.currentWarehouseId },
    });

    if (body.equipmentType == 'VEHICLE' && !body.id) {
      const createWarehouseParams: WarehouseCreateDTO = {
        name: 'Vehicle ' + body.name + ` (${equipment.serialCode})`,
        warehouseType: 'IN_TRANSIT_WAREHOUSE',
        capacity: 1,
        locationId: location.locationId,
        projectId: null,
        equipmentId: equipment.id,
      };

      await this.warehouseService.createWarehouse(createWarehouseParams);
    }

    return equipment;
  }
  async saveParts(body: EquipmentPartCreateDTO) {
    const equipmentPart = await this.prisma.equipmentParts.create({
      data: {
        partName: body.partName,
        equipment: { connect: { id: body.equipmentId } },
        scheduleDay: body.scheduleDay,
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: new Date(
          new Date().setDate(new Date().getDate() + body.scheduleDay),
        ),
      },
    });

    return equipmentPart;
  }
  async saveBrand(body: any) {
    if (!body.brandName) {
      throw new BadRequestException('Brand name is required');
    }

    const brand = await this.prisma.equipmentBrand.create({
      data: { name: body.brandName },
    });

    return brand;
  }
  async savePartsMaintenance(body: EquipmentMaintenanceCreateDTO) {
    const params: Prisma.EquipmentPartsMaintenanceHistoryCreateInput = {
      equipmentParts: { connect: { id: body.partId } },
      maintenanceDate: new Date(),
      isWorking: body.isWorking,
      checkedBy: { connect: { id: this.utilityService.accountInformation.id } },
      maintenanceProof: { connect: { id: body.maintenanceProof } },
    };

    // update part last maintenance date
    const partInformation = await this.prisma.equipmentParts.findUnique({
      where: { id: body.partId },
      include: { equipment: true },
    });
    await this.prisma.equipmentParts.update({
      where: { id: body.partId },
      data: {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: new Date(
          new Date().setDate(
            new Date().getDate() + partInformation.scheduleDay,
          ),
        ),
      },
    });

    const maintenanceHistoryResponse =
      await this.prisma.equipmentPartsMaintenanceHistory.create({
        data: params,
      });
    const warehouseInformation = await this.prisma.warehouse.findUnique({
      where: { id: partInformation.equipment.currentWarehouseId },
    });

    // Item Breakdown
    let createPurchaseOrderResponse = null;

    if (body.repairItemBreakdown && body.repairItemBreakdown.length) {
      const itemBreakdown: ItemListDto[] = await Promise.all(
        body.repairItemBreakdown.map(async (item) => {
          // Ensure id is a number
          const itemId = Number(item.id);
          if (!itemId || isNaN(itemId)) {
            throw new BadRequestException(`Invalid repair item ID: ${item.id}`);
          }

          const repairItemInformation =
            await this.prisma.equipmentPartsItem.findUnique({
              where: { id: itemId },
              include: { item: true },
            });

          if (!repairItemInformation) {
            throw new BadRequestException(
              `Equipment parts item not found with ID: ${itemId}`,
            );
          }

          const itemInformation = repairItemInformation.item;

          return {
            itemId: itemInformation.id,
            itemName: itemInformation.name,
            amount:
              Number(itemInformation.estimatedBuyingPrice) *
              Number(item.quantity),
            quantity: Number(item.quantity),
            unitPrice: Number(itemInformation.estimatedBuyingPrice),
            description: itemInformation.name,
            rate: Number(itemInformation.estimatedBuyingPrice),
          };
        }),
      );

      // update equipment last maintenance date
      const purchaseOrderCreateParams: CreatePurchaseRequestDto = {
        warehouseId: partInformation.equipment.currentWarehouseId,
        projectId: warehouseInformation.projectId,
        memo:
          'For Repair of ' +
          partInformation.partName +
          ' of ' +
          partInformation.equipment.name,
        deliveryDate: new Date(
          new Date().setDate(new Date().getDate() + 3),
        ).toISOString(),
        items: itemBreakdown,
      };

      createPurchaseOrderResponse =
        await this.purchaseOrderService.createPurchaseRequest(
          purchaseOrderCreateParams,
        );

      // update repairItemPurchaseRequest
      await this.prisma.equipmentPartsMaintenanceHistory.update({
        where: { id: maintenanceHistoryResponse.id },
        data: {
          repairItemPurchaseRequest: {
            connect: { id: createPurchaseOrderResponse.id },
          },
        },
      });
    }

    return { maintenanceHistoryResponse, createPurchaseOrderResponse };
  }
  async maintenanceNextStage(id: number) {
    const maintenanceHistory =
      await this.prisma.equipmentPartsMaintenanceHistory.findUnique({
        where: { id },
      });
    const currentStage = maintenanceHistory.repairStage;
    const currentStageInformation = RepairStageReference.find(
      (stage) => stage.key === currentStage,
    );

    if (!currentStageInformation) {
      throw new BadRequestException('Invalid repair stage');
    }

    if (!currentStageInformation.nextStage) {
      throw new BadRequestException('No next stage available');
    }

    await this.prisma.equipmentPartsMaintenanceHistory.update({
      where: { id },
      data: { repairStage: currentStageInformation.nextStage as any },
    });
  }

  async setNextMaintenanceDate(body: EquipmentPartsSetNextMaintenanceDate) {
    const part = await this.prisma.equipmentParts.findUnique({
      where: { id: body.partId },
    });
    const updatedPart = await this.prisma.equipmentParts.update({
      where: { id: body.partId },
      data: {
        nextMaintenanceDate: body.nextMaintenanceDate,
      },
    });

    this.utilityService.log(
      'Set next maintenance date of ' +
        part.partName +
        ' to ' +
        updatedPart.nextMaintenanceDate,
    );

    return updatedPart;
  }
}
