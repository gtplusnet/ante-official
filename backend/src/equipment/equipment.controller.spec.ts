import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  EquipmentCreateDTO,
  EquipmentItemCreateDTO,
  EquipmentMaintenanceCreateDTO,
  EquipmentPartCreateDTO,
  EquipmentPartsSetNextMaintenanceDate,
} from './equipment.interface';
import { Response } from 'express';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let equipmentService: EquipmentService;
  let utilityService: UtilityService;
  let mockResponse: Partial<Response>;

  const mockEquipmentService = {
    getParts: jest.fn(),
    setNextMaintenanceDate: jest.fn(),
    savePartsMaintenance: jest.fn(),
    getPartsTable: jest.fn(),
    getMaintenanceHistoryTable: jest.fn(),
    maintenanceNextStage: jest.fn(),
    getPartsItems: jest.fn(),
    savePartsItems: jest.fn(),
    deletePartsItems: jest.fn(),
    deleteParts: jest.fn(),
    getEquipmentData: jest.fn(),
    table: jest.fn(),
    saveEquipment: jest.fn(),
    saveParts: jest.fn(),
    saveBrand: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: mockEquipmentService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    equipmentService = module.get<EquipmentService>(EquipmentService);
    utilityService = module.get<UtilityService>(UtilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have utility service injected', () => {
    expect(controller.utilityService).toBeDefined();
    expect(controller.utilityService).toBe(utilityService);
  });

  it('should have equipment service injected', () => {
    expect(controller.equipmentService).toBeDefined();
    expect(controller.equipmentService).toBe(equipmentService);
  });

  describe('getParts', () => {
    it('should get parts for equipment', async () => {
      const equipmentId = 123;
      const mockParts = Promise.resolve([
        { id: 1, name: 'Engine', nextMaintenanceDate: '2023-12-01' },
        { id: 2, name: 'Tires', nextMaintenanceDate: '2023-11-15' },
      ]);

      mockEquipmentService.getParts.mockReturnValue(mockParts);

      await controller.getParts(mockResponse as Response, equipmentId);

      expect(mockEquipmentService.getParts).toHaveBeenCalledWith(equipmentId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockParts,
        mockResponse,
      );
    });

    it('should handle string id conversion', async () => {
      const equipmentId = '456'; // String ID
      const mockParts = Promise.resolve([]);

      mockEquipmentService.getParts.mockReturnValue(mockParts);

      await controller.getParts(mockResponse as Response, equipmentId as any);

      expect(mockEquipmentService.getParts).toHaveBeenCalledWith('456');
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockParts,
        mockResponse,
      );
    });
  });

  describe('setNextMaintenanceDate', () => {
    it('should set next maintenance date', async () => {
      const body: EquipmentPartsSetNextMaintenanceDate = {
        partId: 1,
        nextMaintenanceDate: new Date('2023-12-01'),
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Next maintenance date set successfully',
      });

      mockEquipmentService.setNextMaintenanceDate.mockReturnValue(mockResult);

      await controller.setNextMaintenanceDate(mockResponse as Response, body);

      expect(mockEquipmentService.setNextMaintenanceDate).toHaveBeenCalledWith(
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle different date formats', async () => {
      const body: EquipmentPartsSetNextMaintenanceDate = {
        partId: 2,
        nextMaintenanceDate: new Date('2023-12-31T23:59:59Z'),
      };

      const mockResult = Promise.resolve({ success: true });
      mockEquipmentService.setNextMaintenanceDate.mockReturnValue(mockResult);

      await controller.setNextMaintenanceDate(mockResponse as Response, body);

      expect(mockEquipmentService.setNextMaintenanceDate).toHaveBeenCalledWith(
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('savePartsMaintenance', () => {
    it('should save parts maintenance', async () => {
      const body: EquipmentMaintenanceCreateDTO = {
        partId: 1,
        isWorking: true,
        maintenanceProof: 1,
        repairItemBreakdown: [],
      };

      const mockResult = Promise.resolve({
        id: 10,
        message: 'Maintenance record saved successfully',
      });

      mockEquipmentService.savePartsMaintenance.mockReturnValue(mockResult);

      await controller.savePartsMaintenance(mockResponse as Response, body);

      expect(mockEquipmentService.savePartsMaintenance).toHaveBeenCalledWith(
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle maintenance without cost', async () => {
      const body: EquipmentMaintenanceCreateDTO = {
        partId: 2,
        isWorking: false,
        maintenanceProof: 2,
      };

      const mockResult = Promise.resolve({ id: 11, cost: 0 });
      mockEquipmentService.savePartsMaintenance.mockReturnValue(mockResult);

      await controller.savePartsMaintenance(mockResponse as Response, body);

      expect(mockEquipmentService.savePartsMaintenance).toHaveBeenCalledWith(
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('getPartsTable', () => {
    it('should get parts table data', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableData = Promise.resolve({
        data: [
          { id: 1, name: 'Engine', equipment: 'Excavator A' },
          { id: 2, name: 'Hydraulics', equipment: 'Excavator B' },
        ],
        totalCount: 2,
        page: 1,
        perPage: 10,
      });

      mockEquipmentService.getPartsTable.mockReturnValue(mockTableData);

      await controller.getPartsTable(mockResponse as Response, query, body);

      expect(mockEquipmentService.getPartsTable).toHaveBeenCalledWith(
        query,
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableData,
        mockResponse,
      );
    });

    it('should handle filtered table request', async () => {
      const query: TableQueryDTO = {
        page: 2,
        perPage: 5,
      };

      const body: TableBodyDTO = {
        filters: [{ equipmentType: 'excavator' }],
        settings: { sortBy: 'name' },
        searchKeyword: 'engine',
      };

      const mockTableData = Promise.resolve({
        data: [{ id: 1, name: 'Engine V8', equipment: 'Excavator Pro' }],
        totalCount: 1,
        page: 2,
        perPage: 5,
      });

      mockEquipmentService.getPartsTable.mockReturnValue(mockTableData);

      await controller.getPartsTable(mockResponse as Response, query, body);

      expect(mockEquipmentService.getPartsTable).toHaveBeenCalledWith(
        query,
        body,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableData,
        mockResponse,
      );
    });
  });

  describe('getMaintenanceHistory', () => {
    it('should get maintenance history table', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 20,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockHistoryData = Promise.resolve({
        data: [
          {
            id: 1,
            partName: 'Engine',
            maintenanceDate: '2023-10-01',
            description: 'Oil change',
            cost: 200,
          },
          {
            id: 2,
            partName: 'Tires',
            maintenanceDate: '2023-09-15',
            description: 'Rotation',
            cost: 50,
          },
        ],
        totalCount: 2,
      });

      mockEquipmentService.getMaintenanceHistoryTable.mockReturnValue(
        mockHistoryData,
      );

      await controller.getMaintenanceHistory(
        mockResponse as Response,
        query,
        body,
      );

      expect(
        mockEquipmentService.getMaintenanceHistoryTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockHistoryData,
        mockResponse,
      );
    });

    it('should handle empty maintenance history', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = { filters: [], settings: {} };

      const mockHistoryData = Promise.resolve({
        data: [],
        totalCount: 0,
      });

      mockEquipmentService.getMaintenanceHistoryTable.mockReturnValue(
        mockHistoryData,
      );

      await controller.getMaintenanceHistory(
        mockResponse as Response,
        query,
        body,
      );

      expect(
        mockEquipmentService.getMaintenanceHistoryTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockHistoryData,
        mockResponse,
      );
    });
  });

  describe('nextStage', () => {
    it('should move maintenance to next stage', async () => {
      const maintenanceId = 123;
      const mockResult = Promise.resolve({
        id: maintenanceId,
        stage: 'completed',
        message: 'Maintenance moved to next stage',
      });

      mockEquipmentService.maintenanceNextStage.mockReturnValue(mockResult);

      await controller.nextStage(mockResponse as Response, maintenanceId);

      expect(mockEquipmentService.maintenanceNextStage).toHaveBeenCalledWith(
        maintenanceId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle string id for next stage', async () => {
      const maintenanceId = '456';
      const mockResult = Promise.resolve({ stage: 'in-progress' });

      mockEquipmentService.maintenanceNextStage.mockReturnValue(mockResult);

      await controller.nextStage(
        mockResponse as Response,
        maintenanceId as any,
      );

      expect(mockEquipmentService.maintenanceNextStage).toHaveBeenCalledWith(
        '456',
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('getPartsItems', () => {
    it('should get parts items', async () => {
      const partId = 123;
      const mockItems = Promise.resolve([
        { id: 1, name: 'Oil Filter', quantity: 5, cost: 25 },
        { id: 2, name: 'Spark Plug', quantity: 8, cost: 15 },
      ]);

      mockEquipmentService.getPartsItems.mockReturnValue(mockItems);

      await controller.getPartsItems(mockResponse as Response, partId);

      expect(mockEquipmentService.getPartsItems).toHaveBeenCalledWith(partId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockItems,
        mockResponse,
      );
    });

    it('should handle empty parts items', async () => {
      const partId = 999;
      const mockItems = Promise.resolve([]);

      mockEquipmentService.getPartsItems.mockReturnValue(mockItems);

      await controller.getPartsItems(mockResponse as Response, partId);

      expect(mockEquipmentService.getPartsItems).toHaveBeenCalledWith(partId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockItems,
        mockResponse,
      );
    });
  });

  describe('savePartsItems', () => {
    it('should save parts items', async () => {
      const body: EquipmentItemCreateDTO = {
        partId: 1,
        itemId: 'ITEM001',
        quantity: 10,
      };

      const mockResult = Promise.resolve({
        id: 100,
        message: 'Parts item saved successfully',
      });

      mockEquipmentService.savePartsItems.mockReturnValue(mockResult);

      await controller.savePartsItems(mockResponse as Response, body);

      expect(mockEquipmentService.savePartsItems).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle parts items without supplier', async () => {
      const body: EquipmentItemCreateDTO = {
        partId: 2,
        itemId: 'ITEM002',
        quantity: 1,
      };

      const mockResult = Promise.resolve({ id: 101 });
      mockEquipmentService.savePartsItems.mockReturnValue(mockResult);

      await controller.savePartsItems(mockResponse as Response, body);

      expect(mockEquipmentService.savePartsItems).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('deletePartsItems', () => {
    it('should delete parts item', async () => {
      const itemId = 123;
      const mockResult = Promise.resolve({
        success: true,
        message: 'Parts item deleted successfully',
      });

      mockEquipmentService.deletePartsItems.mockReturnValue(mockResult);

      await controller.deletePartsItems(mockResponse as Response, itemId);

      expect(mockEquipmentService.deletePartsItems).toHaveBeenCalledWith(
        itemId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle non-existent item deletion', async () => {
      const itemId = 999;
      const mockResult = Promise.resolve({
        success: false,
        message: 'Parts item not found',
      });

      mockEquipmentService.deletePartsItems.mockReturnValue(mockResult);

      await controller.deletePartsItems(mockResponse as Response, itemId);

      expect(mockEquipmentService.deletePartsItems).toHaveBeenCalledWith(
        itemId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('deleteParts', () => {
    it('should delete equipment part', async () => {
      const partId = 456;
      const mockResult = Promise.resolve({
        success: true,
        message: 'Equipment part deleted successfully',
      });

      mockEquipmentService.deleteParts.mockReturnValue(mockResult);

      await controller.deleteParts(mockResponse as Response, partId);

      expect(mockEquipmentService.deleteParts).toHaveBeenCalledWith(partId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle part deletion with dependencies', async () => {
      const partId = 789;
      const mockResult = Promise.resolve({
        success: false,
        message: 'Cannot delete part with existing maintenance records',
      });

      mockEquipmentService.deleteParts.mockReturnValue(mockResult);

      await controller.deleteParts(mockResponse as Response, partId);

      expect(mockEquipmentService.deleteParts).toHaveBeenCalledWith(partId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('getEquipmentData', () => {
    it('should get equipment data by id', async () => {
      const equipmentId = 123;
      const mockEquipment = Promise.resolve({
        id: equipmentId,
        name: 'Excavator A1',
        brand: 'Caterpillar',
        model: 'CAT320',
        year: 2020,
        status: 'active',
      });

      mockEquipmentService.getEquipmentData.mockReturnValue(mockEquipment);

      await controller.getEquipmentData(mockResponse as Response, equipmentId);

      expect(mockEquipmentService.getEquipmentData).toHaveBeenCalledWith(
        equipmentId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockEquipment,
        mockResponse,
      );
    });

    it('should handle non-existent equipment', async () => {
      const equipmentId = 999;
      const mockEquipment = Promise.resolve(null);

      mockEquipmentService.getEquipmentData.mockReturnValue(mockEquipment);

      await controller.getEquipmentData(mockResponse as Response, equipmentId);

      expect(mockEquipmentService.getEquipmentData).toHaveBeenCalledWith(
        equipmentId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockEquipment,
        mockResponse,
      );
    });
  });

  describe('table', () => {
    it('should get equipment table data', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableData = Promise.resolve({
        data: [
          {
            id: 1,
            name: 'Excavator A',
            brand: 'Caterpillar',
            status: 'active',
          },
          {
            id: 2,
            name: 'Bulldozer B',
            brand: 'John Deere',
            status: 'maintenance',
          },
        ],
        totalCount: 2,
        page: 1,
        perPage: 10,
      });

      mockEquipmentService.table.mockReturnValue(mockTableData);

      await controller.table(mockResponse as Response, query, body);

      expect(mockEquipmentService.table).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableData,
        mockResponse,
      );
    });

    it('should handle equipment table with filters', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 5,
        status: 'active',
      };

      const body: TableBodyDTO = {
        filters: [{ brand: 'Caterpillar' }],
        settings: { sortBy: 'name' },
        searchKeyword: 'excavator',
      };

      const mockTableData = Promise.resolve({
        data: [{ id: 1, name: 'Excavator Pro', brand: 'Caterpillar' }],
        totalCount: 1,
      });

      mockEquipmentService.table.mockReturnValue(mockTableData);

      await controller.table(mockResponse as Response, query, body);

      expect(mockEquipmentService.table).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableData,
        mockResponse,
      );
    });
  });

  describe('saveEquipment', () => {
    it('should save new equipment', async () => {
      const body: EquipmentCreateDTO = {
        name: 'New Excavator',
        serialCode: 'KOM12345',
        brandId: 1,
        equipmentType: 'VEHICLE',
        currentWarehouseId: 'WH001',
      };

      const mockResult = Promise.resolve({
        id: 200,
        message: 'Equipment saved successfully',
      });

      mockEquipmentService.saveEquipment.mockReturnValue(mockResult);

      await controller.saveEquipment(mockResponse as Response, body);

      expect(mockEquipmentService.saveEquipment).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should update existing equipment', async () => {
      const body: EquipmentCreateDTO = {
        id: 150,
        name: 'Updated Excavator',
        serialCode: 'KOM54321',
        brandId: 2,
        equipmentType: 'TOOL',
        currentWarehouseId: 'WH002',
      };

      const mockResult = Promise.resolve({
        id: 150,
        message: 'Equipment updated successfully',
      });

      mockEquipmentService.saveEquipment.mockReturnValue(mockResult);

      await controller.saveEquipment(mockResponse as Response, body);

      expect(mockEquipmentService.saveEquipment).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('saveParts', () => {
    it('should save equipment part', async () => {
      const body: EquipmentPartCreateDTO = {
        equipmentId: 1,
        partName: 'Hydraulic Pump',
        scheduleDay: 180,
      };

      const mockResult = Promise.resolve({
        id: 50,
        message: 'Equipment part saved successfully',
      });

      mockEquipmentService.saveParts.mockReturnValue(mockResult);

      await controller.saveParts(mockResponse as Response, body);

      expect(mockEquipmentService.saveParts).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should save part without description', async () => {
      const body: EquipmentPartCreateDTO = {
        equipmentId: 2,
        partName: 'Air Filter',
        scheduleDay: 90,
      };

      const mockResult = Promise.resolve({ id: 51 });
      mockEquipmentService.saveParts.mockReturnValue(mockResult);

      await controller.saveParts(mockResponse as Response, body);

      expect(mockEquipmentService.saveParts).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('saveBrand', () => {
    it('should save equipment brand', async () => {
      const body = {
        name: 'Volvo',
        country: 'Sweden',
        description: 'Heavy machinery manufacturer',
      };

      const mockResult = Promise.resolve({
        id: 10,
        message: 'Brand saved successfully',
      });

      mockEquipmentService.saveBrand.mockReturnValue(mockResult);

      await controller.saveBrand(mockResponse as Response, body);

      expect(mockEquipmentService.saveBrand).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should save brand with minimal data', async () => {
      const body = { name: 'Generic Brand' };

      const mockResult = Promise.resolve({ id: 11 });
      mockEquipmentService.saveBrand.mockReturnValue(mockResult);

      await controller.saveBrand(mockResponse as Response, body);

      expect(mockEquipmentService.saveBrand).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle empty brand object', async () => {
      const body = {};

      const mockResult = Promise.resolve({ error: 'Brand name required' });
      mockEquipmentService.saveBrand.mockReturnValue(mockResult);

      await controller.saveBrand(mockResponse as Response, body);

      expect(mockEquipmentService.saveBrand).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors in getParts', async () => {
      const equipmentId = 123;
      const mockError = Promise.reject(new Error('Database connection failed'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockEquipmentService.getParts.mockReturnValue(mockError);

      await controller.getParts(mockResponse as Response, equipmentId);

      expect(mockEquipmentService.getParts).toHaveBeenCalledWith(equipmentId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in saveEquipment', async () => {
      const body: EquipmentCreateDTO = {
        name: 'Test',
        serialCode: 'TEST001',
        brandId: 1,
        equipmentType: 'VEHICLE',
        currentWarehouseId: 'WH001',
      };
      const mockError = Promise.reject(new Error('Validation failed'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockEquipmentService.saveEquipment.mockReturnValue(mockError);

      await controller.saveEquipment(mockResponse as Response, body);

      expect(mockEquipmentService.saveEquipment).toHaveBeenCalledWith(body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in table operations', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = { filters: [], settings: {} };
      const mockError = Promise.reject(new Error('Table query failed'));
      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      mockEquipmentService.table.mockReturnValue(mockError);

      await controller.table(mockResponse as Response, query, body);

      expect(mockEquipmentService.table).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('parameter validation', () => {
    it('should handle zero values for IDs', async () => {
      const zeroId = 0;
      const mockResult = Promise.resolve(null);

      mockEquipmentService.getEquipmentData.mockReturnValue(mockResult);

      await controller.getEquipmentData(mockResponse as Response, zeroId);

      expect(mockEquipmentService.getEquipmentData).toHaveBeenCalledWith(
        zeroId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle negative values for IDs', async () => {
      const negativeId = -1;
      const mockResult = Promise.resolve(null);

      mockEquipmentService.getParts.mockReturnValue(mockResult);

      await controller.getParts(mockResponse as Response, negativeId);

      expect(mockEquipmentService.getParts).toHaveBeenCalledWith(negativeId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });
});
