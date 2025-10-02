import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { PurchaseOrderService } from '@modules/finance/purchase-order/purchase-order/purchase-order.service';
import { WarehouseService } from '@modules/inventory/warehouse/warehouse/warehouse.service';
import {
  createMockPrismaService,
  createMockUtilityService,
  createMockTableHandlerService,
} from '../../test/setup';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockUtility: ReturnType<typeof createMockUtilityService>;
  let mockTableHandler: ReturnType<typeof createMockTableHandlerService>;
  let mockPurchaseOrderService: Partial<PurchaseOrderService>;
  let mockWarehouseService: Partial<WarehouseService>;

  const mockEquipment = {
    id: 1,
    name: 'Test Equipment',
    serialCode: 'EQ001',
    equipmentType: 'MACHINERY',
    brandId: 1,
    currentWarehouseId: 1,
    companyId: 'test-company-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: {
      id: 1,
      name: 'Test Brand',
    },
    currentWarehouse: {
      id: 1,
      name: 'Test Warehouse',
      locationId: 1,
    },
  };

  const mockEquipmentPart = {
    id: 1,
    partName: 'Test Part',
    equipmentId: 1,
    scheduleDay: 30,
    lastMaintenanceDate: new Date(),
    nextMaintenanceDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    equipment: mockEquipment,
  };

  const mockTableQuery = {
    page: 1,
    limit: 10,
    search: '',
    sort: 'id',
    order: 'asc',
  };

  const mockTableBody = {
    columns: [],
    filters: {},
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockUtility = createMockUtilityService();
    mockTableHandler = createMockTableHandlerService();

    mockPurchaseOrderService = {
      createPurchaseRequest: jest.fn().mockResolvedValue({ id: 1 }),
    };

    mockWarehouseService = {
      createWarehouse: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UtilityService, useValue: mockUtility },
        { provide: TableHandlerService, useValue: mockTableHandler },
        { provide: PurchaseOrderService, useValue: mockPurchaseOrderService },
        { provide: WarehouseService, useValue: mockWarehouseService },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('table', () => {
    beforeEach(() => {
      (mockTableHandler.getTableData as jest.Mock).mockResolvedValue({
        list: [mockEquipment],
        currentPage: 1,
        pagination: {
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
        },
      });
    });

    it('should return formatted equipment list', async () => {
      const result = await service.table(
        mockTableQuery as any,
        mockTableBody as any,
      );

      expect(mockTableHandler.initialize).toHaveBeenCalledWith(
        mockTableQuery,
        mockTableBody,
        'equipment',
      );
      expect(mockTableHandler.constructTableQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('currentPage');
      expect(result.list).toHaveLength(1);
      expect(result.list[0]).toHaveProperty('id');
      expect(result.list[0]).toHaveProperty('name');
      expect(result.list[0]).toHaveProperty('serialCode');
    });

    it('should include company filter in table query', async () => {
      await service.table(mockTableQuery as any, mockTableBody as any);

      expect(mockTableHandler.getTableData).toHaveBeenCalledWith(
        mockPrisma.equipment,
        mockTableQuery,
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockUtility.companyId,
          }),
          include: { currentWarehouse: true, brand: true },
        }),
      );
    });
  });

  describe('getEquipmentData', () => {
    it('should return formatted equipment data', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);

      const result = await service.getEquipmentData(1);

      expect(mockPrisma.equipment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          currentWarehouse: true,
          brand: true,
        },
      });
      expect(result).toHaveProperty('equipmentData');
      expect(result.equipmentData).toHaveProperty('id', 1);
      expect(result.equipmentData).toHaveProperty('name', 'Test Equipment');
    });

    it('should handle non-existent equipment', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      const result = await service.getEquipmentData(999);

      expect(result.equipmentData).toBe(null);
    });
  });

  describe('saveEquipment', () => {
    const createParams = {
      name: 'New Equipment',
      serialCode: 'EQ002',
      brandId: 1,
      currentWarehouseId: 1,
      equipmentType: 'VEHICLE',
    };

    it('should create new equipment', async () => {
      mockPrisma.equipment.create.mockResolvedValue({
        ...mockEquipment,
        ...createParams,
      });
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        id: 1,
        locationId: 1,
      });

      const result = await service.saveEquipment(createParams as any);

      expect(mockPrisma.equipment.create).toHaveBeenCalledWith({
        data: {
          name: createParams.name,
          serialCode: createParams.serialCode,
          brand: { connect: { id: createParams.brandId } },
          currentWarehouse: {
            connect: { id: createParams.currentWarehouseId },
          },
          equipmentType: createParams.equipmentType,
          company: { connect: { id: mockUtility.companyId } },
        },
      });
      expect(result).toHaveProperty('name', createParams.name);
    });

    it('should update existing equipment', async () => {
      const updateParams = { ...createParams, id: 1 };
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        ...updateParams,
      });
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        id: 1,
        locationId: 1,
      });

      await service.saveEquipment(updateParams as any);

      expect(mockPrisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: updateParams.name,
          serialCode: updateParams.serialCode,
          brand: { connect: { id: updateParams.brandId } },
          currentWarehouse: {
            connect: { id: updateParams.currentWarehouseId },
          },
          equipmentType: updateParams.equipmentType,
          company: { connect: { id: mockUtility.companyId } },
        },
      });
    });

    it('should create in-transit warehouse for new vehicle', async () => {
      const vehicleParams = { ...createParams, equipmentType: 'VEHICLE' };
      mockPrisma.equipment.create.mockResolvedValue({
        ...mockEquipment,
        id: 2,
        ...vehicleParams,
      });
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        id: 1,
        locationId: 1,
      });

      await service.saveEquipment(vehicleParams as any);

      expect(mockWarehouseService.createWarehouse).toHaveBeenCalledWith({
        name: `Vehicle ${vehicleParams.name} (${vehicleParams.serialCode})`,
        warehouseType: 'IN_TRANSIT_WAREHOUSE',
        capacity: 1,
        locationId: 1,
        projectId: null,
        equipmentId: 2,
      });
    });

    it('should not create in-transit warehouse for updated vehicle', async () => {
      const updateVehicleParams = {
        ...createParams,
        id: 1,
        equipmentType: 'VEHICLE',
      };
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        ...updateVehicleParams,
      });
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        id: 1,
        locationId: 1,
      });

      await service.saveEquipment(updateVehicleParams as any);

      expect(mockWarehouseService.createWarehouse).not.toHaveBeenCalled();
    });
  });

  describe('parts management', () => {
    describe('getParts', () => {
      it('should return parts with item count', async () => {
        mockPrisma.equipmentParts.findMany.mockResolvedValue([
          mockEquipmentPart,
        ]);
        mockPrisma.equipmentPartsItem.findMany.mockResolvedValue([
          { id: 1, equipmentPartsId: 1, itemId: 1 },
          { id: 2, equipmentPartsId: 1, itemId: 2 },
        ]);

        const result = await service.getParts(1);

        expect(mockPrisma.equipmentParts.findMany).toHaveBeenCalledWith({
          where: { equipmentId: 1 },
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('itemsCount', 2);
      });
    });

    describe('saveParts', () => {
      it('should create equipment part with correct schedule', async () => {
        const partParams = {
          partName: 'New Part',
          equipmentId: 1,
          scheduleDay: 60,
        };
        const expectedPart = { id: 1, ...partParams };
        mockPrisma.equipmentParts.create.mockResolvedValue(expectedPart);

        await service.saveParts(partParams as any);

        expect(mockPrisma.equipmentParts.create).toHaveBeenCalledWith({
          data: {
            partName: partParams.partName,
            equipment: { connect: { id: partParams.equipmentId } },
            scheduleDay: partParams.scheduleDay,
            lastMaintenanceDate: expect.any(Date),
            nextMaintenanceDate: expect.any(Date),
          },
        });

        const createCall = mockPrisma.equipmentParts.create.mock.calls[0][0];
        const nextMaintenanceDate = createCall.data.nextMaintenanceDate;
        const lastMaintenanceDate = createCall.data.lastMaintenanceDate;

        // Verify that next maintenance date is 60 days after last maintenance
        const diffInDays = Math.floor(
          (nextMaintenanceDate - lastMaintenanceDate) / (1000 * 60 * 60 * 24),
        );
        expect(diffInDays).toBe(60);
      });
    });

    describe('deleteParts', () => {
      it('should delete equipment part', async () => {
        await service.deleteParts(1);

        expect(mockPrisma.equipmentParts.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
      });
    });

    describe('getPartsItems', () => {
      it('should return parts items with item details', async () => {
        const mockPartsItems = [
          {
            id: 1,
            equipmentPartsId: 1,
            itemId: 1,
            quantity: 5,
            item: { id: 1, name: 'Test Item' },
          },
        ];
        mockPrisma.equipmentPartsItem.findMany.mockResolvedValue(
          mockPartsItems,
        );

        const result = await service.getPartsItems(1);

        expect(mockPrisma.equipmentPartsItem.findMany).toHaveBeenCalledWith({
          where: { equipmentPartsId: 1 },
          include: { item: true },
        });
        expect(result).toEqual(mockPartsItems);
      });
    });

    describe('savePartsItems', () => {
      const itemParams = {
        partId: 1,
        itemId: 1,
        quantity: 5,
      };

      it('should create new parts item', async () => {
        mockPrisma.equipmentPartsItem.findUnique.mockResolvedValue(null);

        await service.savePartsItems(itemParams as any);

        expect(mockPrisma.equipmentPartsItem.create).toHaveBeenCalledWith({
          data: {
            equipmentPartsId: itemParams.partId,
            itemId: itemParams.itemId,
            quantity: itemParams.quantity,
          },
        });
      });

      it('should update existing parts item by incrementing quantity', async () => {
        const existingItem = {
          id: 1,
          equipmentPartsId: 1,
          itemId: 1,
          quantity: 3,
        };
        mockPrisma.equipmentPartsItem.findUnique.mockResolvedValue(
          existingItem,
        );

        await service.savePartsItems(itemParams as any);

        expect(mockPrisma.equipmentPartsItem.update).toHaveBeenCalledWith({
          where: {
            equipmentPartsId_itemId: {
              equipmentPartsId: itemParams.partId,
              itemId: itemParams.itemId,
            },
          },
          data: { quantity: { increment: itemParams.quantity } },
        });
      });
    });

    describe('deletePartsItems', () => {
      it('should delete parts item', async () => {
        await service.deletePartsItems(1);

        expect(mockPrisma.equipmentPartsItem.delete).toHaveBeenCalledWith({
          where: { id: 1 },
        });
      });
    });
  });

  describe('brand management', () => {
    describe('saveBrand', () => {
      it('should create new brand', async () => {
        const brandParams = { brandName: 'New Brand' };
        const expectedBrand = { id: 1, name: brandParams.brandName };
        mockPrisma.equipmentBrand.create.mockResolvedValue(expectedBrand);

        const result = await service.saveBrand(brandParams);

        expect(mockPrisma.equipmentBrand.create).toHaveBeenCalledWith({
          data: { name: brandParams.brandName },
        });
        expect(result).toEqual(expectedBrand);
      });

      it('should throw error for missing brand name', async () => {
        await expect(service.saveBrand({})).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.saveBrand({ brandName: '' })).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.saveBrand({ brandName: null })).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('maintenance management', () => {
    describe('savePartsMaintenance', () => {
      const maintenanceParams = {
        partId: 1,
        isWorking: true,
        maintenanceProof: 1,
        repairItemBreakdown: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 3 },
        ],
      };

      beforeEach(() => {
        mockPrisma.equipmentParts.findUnique.mockResolvedValue({
          ...mockEquipmentPart,
          equipment: {
            ...mockEquipment,
            currentWarehouseId: 1,
          },
        });
        mockPrisma.warehouse.findUnique.mockResolvedValue({
          id: 1,
          projectId: 1,
        });
        mockPrisma.equipmentPartsMaintenanceHistory.create.mockResolvedValue({
          id: 1,
        });
        mockPrisma.equipmentPartsItem.findUnique
          .mockResolvedValueOnce({
            id: 1,
            item: { id: 1, name: 'Item 1', estimatedBuyingPrice: 10 },
          })
          .mockResolvedValueOnce({
            id: 2,
            item: { id: 2, name: 'Item 2', estimatedBuyingPrice: 15 },
          });
      });

      it('should create maintenance history and update part dates', async () => {
        await service.savePartsMaintenance(maintenanceParams as any);

        expect(
          mockPrisma.equipmentPartsMaintenanceHistory.create,
        ).toHaveBeenCalledWith({
          data: {
            equipmentParts: { connect: { id: maintenanceParams.partId } },
            maintenanceDate: expect.any(Date),
            isWorking: maintenanceParams.isWorking,
            checkedBy: { connect: { id: mockUtility.accountInformation.id } },
            maintenanceProof: {
              connect: { id: maintenanceParams.maintenanceProof },
            },
          },
        });

        expect(mockPrisma.equipmentParts.update).toHaveBeenCalledWith({
          where: { id: maintenanceParams.partId },
          data: {
            lastMaintenanceDate: expect.any(Date),
            nextMaintenanceDate: expect.any(Date),
          },
        });
      });

      it('should create purchase request for repair items', async () => {
        await service.savePartsMaintenance(maintenanceParams as any);

        expect(
          mockPurchaseOrderService.createPurchaseRequest,
        ).toHaveBeenCalledWith({
          warehouseId: 1,
          projectId: 1,
          memo: `For Repair of ${mockEquipmentPart.partName} of ${mockEquipment.name}`,
          deliveryDate: expect.any(String),
          items: [
            {
              itemId: 1,
              itemName: 'Item 1',
              amount: 20, // 10 * 2
              quantity: 2,
              unitPrice: 10,
              description: 'Item 1',
              rate: 10,
            },
            {
              itemId: 2,
              itemName: 'Item 2',
              amount: 45, // 15 * 3
              quantity: 3,
              unitPrice: 15,
              description: 'Item 2',
              rate: 15,
            },
          ],
        });
      });

      it('should handle maintenance without repair items', async () => {
        const paramsWithoutItems = {
          partId: 1,
          isWorking: true,
          maintenanceProof: 1,
        };

        const result = await service.savePartsMaintenance(
          paramsWithoutItems as any,
        );

        expect(result.createPurchaseOrderResponse).toBeNull();
        expect(
          mockPurchaseOrderService.createPurchaseRequest,
        ).not.toHaveBeenCalled();
      });

      it('should throw error for invalid repair item ID', async () => {
        const invalidParams = {
          ...maintenanceParams,
          repairItemBreakdown: [{ id: 'invalid', quantity: 1 }],
        };

        await expect(
          service.savePartsMaintenance(invalidParams as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle non-existent repair item gracefully', async () => {
        mockPrisma.equipmentPartsItem.findUnique.mockResolvedValue(null);

        const result = await service.savePartsMaintenance(
          maintenanceParams as any,
        );

        expect(result).toHaveProperty('maintenanceHistoryResponse');
        expect(result).toHaveProperty('createPurchaseOrderResponse');
      });
    });

    describe('maintenanceNextStage', () => {
      const mockMaintenanceHistory = {
        id: 1,
        repairStage: 'PENDING_REPAIR',
      };

      it('should update maintenance to next stage', async () => {
        mockPrisma.equipmentPartsMaintenanceHistory.findUnique.mockResolvedValue(
          mockMaintenanceHistory,
        );

        await service.maintenanceNextStage(1);

        expect(
          mockPrisma.equipmentPartsMaintenanceHistory.update,
        ).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { repairStage: expect.any(String) },
        });
      });

      it('should throw error for invalid repair stage', async () => {
        const invalidStageHistory = {
          ...mockMaintenanceHistory,
          repairStage: 'INVALID_STAGE',
        };
        mockPrisma.equipmentPartsMaintenanceHistory.findUnique.mockResolvedValue(
          invalidStageHistory,
        );

        await expect(service.maintenanceNextStage(1)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('setNextMaintenanceDate', () => {
      const dateParams = {
        partId: 1,
        nextMaintenanceDate: new Date('2024-01-01'),
      };

      it('should update next maintenance date', async () => {
        mockPrisma.equipmentParts.findUnique.mockResolvedValue(
          mockEquipmentPart,
        );
        mockPrisma.equipmentParts.update.mockResolvedValue({
          ...mockEquipmentPart,
          nextMaintenanceDate: dateParams.nextMaintenanceDate,
        });

        const result = await service.setNextMaintenanceDate(dateParams as any);

        expect(mockPrisma.equipmentParts.update).toHaveBeenCalledWith({
          where: { id: dateParams.partId },
          data: {
            nextMaintenanceDate: dateParams.nextMaintenanceDate,
          },
        });

        expect(mockUtility.log).toHaveBeenCalledWith(
          `Set next maintenance date of ${mockEquipmentPart.partName} to ${result.nextMaintenanceDate}`,
        );
      });
    });
  });

  describe('getMaintenanceHistoryTable', () => {
    const mockMaintenanceHistory = {
      id: 1,
      repairStage: 'PENDING_REPAIR',
      repairItemPurchaseRequest: {
        id: 1,
        status: 'PURCHASE_ORDER',
      },
      equipmentParts: mockEquipmentPart,
    };

    beforeEach(() => {
      (mockTableHandler.getTableData as jest.Mock).mockResolvedValue({
        list: [mockMaintenanceHistory],
        currentPage: 1,
        pagination: {
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
        },
      });
    });

    it('should return formatted maintenance history', async () => {
      mockPrisma.purchaseOrder.findMany.mockResolvedValue([
        {
          itemReceipt: {
            delivery: { status: 'DELIVERED' },
          },
        },
      ]);

      const result = await service.getMaintenanceHistoryTable(
        mockTableQuery as any,
        mockTableBody as any,
      );

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result.list).toHaveLength(1);
    });

    it('should update repair stage based on purchase order status', async () => {
      mockPrisma.purchaseOrder.findMany.mockResolvedValue([
        {
          itemReceipt: {
            delivery: { status: 'PENDING' },
          },
        },
      ]);

      const result = await service.getMaintenanceHistoryTable(
        mockTableQuery as any,
        mockTableBody as any,
      );

      expect(result.list[0]).toHaveProperty('repairStage');
    });
  });

  describe('getPartsTable', () => {
    beforeEach(() => {
      (mockTableHandler.getTableData as jest.Mock).mockResolvedValue({
        list: [mockEquipmentPart],
        currentPage: 1,
        pagination: {
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
        },
      });
      mockPrisma.equipmentPartsItem.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('should return parts with item counts', async () => {
      const result = await service.getPartsTable(
        mockTableQuery as any,
        mockTableBody as any,
      );

      expect(mockTableHandler.initialize).toHaveBeenCalledWith(
        mockTableQuery,
        mockTableBody,
        'equipmentParts',
      );
      expect(result).toHaveProperty('list');
      expect(result.list[0]).toHaveProperty('itemsCount', 2);
    });

    it('should filter by company through equipment relation', async () => {
      await service.getPartsTable(mockTableQuery as any, mockTableBody as any);

      expect(mockTableHandler.getTableData).toHaveBeenCalledWith(
        mockPrisma.equipmentParts,
        mockTableQuery,
        expect.objectContaining({
          where: expect.objectContaining({
            equipment: {
              companyId: mockUtility.companyId,
            },
          }),
        }),
      );
    });
  });

  describe('private formatting methods', () => {
    describe('formatEquipmentResponse', () => {
      it('should format equipment correctly', () => {
        const formatted = (service as any).formatEquipmentResponse(
          mockEquipment,
        );

        expect(formatted).toEqual({
          id: mockEquipment.id,
          name: mockEquipment.name,
          serialCode: mockEquipment.serialCode,
          equipmentType: mockEquipment.equipmentType,
          brandId: mockEquipment.brandId,
          currentWarehouseId: mockEquipment.currentWarehouseId,
          createdAt: mockUtility.formatDate(mockEquipment.createdAt),
          currentWarehouse: mockEquipment.currentWarehouse,
          brand: mockEquipment.brand,
        });
      });

      it('should handle null equipment', () => {
        const result = (service as any).formatEquipmentResponse(null);
        expect(result).toBeNull();
      });
    });
  });
});
