import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DeliveryStatus, TruckLoadStage } from '@prisma/client';
import {
  SetStageForDeliveryDTO,
  ReceiveItemDTO,
  CreateDeliveryDTO,
} from './delivery.validator';

describe('Delivery Validator DTOs', () => {
  describe('SetStageForDeliveryDTO', () => {
    it('should validate when all required fields are provided', async () => {
      const validData = {
        deliveryId: 123,
        warehouseId: 'warehouse-123',
      };

      const dto = plainToInstance(SetStageForDeliveryDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when deliveryId is missing', async () => {
      const invalidData = {
        warehouseId: 'warehouse-123',
      };

      const dto = plainToInstance(SetStageForDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const deliveryIdError = errors.find(
        (error) => error.property === 'deliveryId',
      );
      expect(deliveryIdError).toBeDefined();
    });

    it('should fail validation when warehouseId is missing', async () => {
      const invalidData = {
        deliveryId: 123,
      };

      const dto = plainToInstance(SetStageForDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const warehouseIdError = errors.find(
        (error) => error.property === 'warehouseId',
      );
      expect(warehouseIdError).toBeDefined();
    });

    it('should fail validation when deliveryId is not an integer', async () => {
      const invalidData = {
        deliveryId: 'not-a-number',
        warehouseId: 'warehouse-123',
      };

      const dto = plainToInstance(SetStageForDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const deliveryIdError = errors.find(
        (error) => error.property === 'deliveryId',
      );
      expect(deliveryIdError).toBeDefined();
    });

    it('should fail validation when warehouseId is empty string', async () => {
      const invalidData = {
        deliveryId: 123,
        warehouseId: '',
      };

      const dto = plainToInstance(SetStageForDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const warehouseIdError = errors.find(
        (error) => error.property === 'warehouseId',
      );
      expect(warehouseIdError).toBeDefined();
    });
  });

  describe('ReceiveItemDTO', () => {
    it('should validate when all required fields are provided', async () => {
      const validData = {
        deliveryId: 123,
        warehouseId: 'warehouse-123',
        items: [
          { itemId: 'item-1', quantity: 10, rate: 100.5 },
          { itemId: 'item-2', quantity: 5, rate: 200.75 },
        ],
      };

      const dto = plainToInstance(ReceiveItemDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when deliveryId is missing', async () => {
      const invalidData = {
        warehouseId: 'warehouse-123',
        items: [{ itemId: 'item-1', quantity: 10, rate: 50.25 }],
      };

      const dto = plainToInstance(ReceiveItemDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const deliveryIdError = errors.find(
        (error) => error.property === 'deliveryId',
      );
      expect(deliveryIdError).toBeDefined();
    });

    it('should fail validation when items array is empty', async () => {
      const invalidData = {
        deliveryId: 123,
        warehouseId: 'warehouse-123',
        items: [],
      };

      const dto = plainToInstance(ReceiveItemDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const itemsError = errors.find((error) => error.property === 'items');
      expect(itemsError).toBeDefined();
    });

    it('should fail validation when items is missing', async () => {
      const invalidData = {
        deliveryId: 123,
        warehouseId: 'warehouse-123',
      };

      const dto = plainToInstance(ReceiveItemDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const itemsError = errors.find((error) => error.property === 'items');
      expect(itemsError).toBeDefined();
    });

    it('should validate with single item', async () => {
      const validData = {
        deliveryId: 123,
        warehouseId: 'warehouse-123',
        items: [{ itemId: 'item-1', quantity: 1, rate: 25.0 }],
      };

      const dto = plainToInstance(ReceiveItemDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateDeliveryDTO', () => {
    it('should validate when all required fields are provided', async () => {
      const validData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        sourceDeliveryReceiptId: 456,
        toWarehouseId: 'warehouse-destination',
      };

      const dto = plainToInstance(CreateDeliveryDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate with all optional fields provided', async () => {
      const validData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        sourceDeliveryReceiptId: 456,
        fromWarehouseId: 'warehouse-source',
        inTransitWarehouseId: 'warehouse-transit',
        toWarehouseId: 'warehouse-destination',
        pickUpLocationId: 'location-123',
        status: DeliveryStatus.PENDING,
        inTransitDeliveryReceiptId: 789,
        truckLoadStage: TruckLoadStage.FOR_LOADING,
      };

      const dto = plainToInstance(CreateDeliveryDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when deliveryDate is missing', async () => {
      const invalidData = {
        sourceDeliveryReceiptId: 456,
        toWarehouseId: 'warehouse-destination',
      };

      const dto = plainToInstance(CreateDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const deliveryDateError = errors.find(
        (error) => error.property === 'deliveryDate',
      );
      expect(deliveryDateError).toBeDefined();
    });

    it('should fail validation when sourceDeliveryReceiptId is missing', async () => {
      const invalidData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        toWarehouseId: 'warehouse-destination',
      };

      const dto = plainToInstance(CreateDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const sourceReceiptError = errors.find(
        (error) => error.property === 'sourceDeliveryReceiptId',
      );
      expect(sourceReceiptError).toBeDefined();
    });

    it('should fail validation when toWarehouseId is missing', async () => {
      const invalidData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        sourceDeliveryReceiptId: 456,
      };

      const dto = plainToInstance(CreateDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const toWarehouseError = errors.find(
        (error) => error.property === 'toWarehouseId',
      );
      expect(toWarehouseError).toBeDefined();
    });

    it('should fail validation when deliveryDate is not a valid date string', async () => {
      const invalidData = {
        deliveryDate: 'not-a-date',
        sourceDeliveryReceiptId: 456,
        toWarehouseId: 'warehouse-destination',
      };

      const dto = plainToInstance(CreateDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const deliveryDateError = errors.find(
        (error) => error.property === 'deliveryDate',
      );
      expect(deliveryDateError).toBeDefined();
    });

    it('should fail validation when sourceDeliveryReceiptId is not a number', async () => {
      const invalidData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        sourceDeliveryReceiptId: 'not-a-number',
        toWarehouseId: 'warehouse-destination',
      };

      const dto = plainToInstance(CreateDeliveryDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const sourceReceiptError = errors.find(
        (error) => error.property === 'sourceDeliveryReceiptId',
      );
      expect(sourceReceiptError).toBeDefined();
    });

    it('should validate with different delivery statuses', async () => {
      const statuses = [
        DeliveryStatus.PENDING,
        DeliveryStatus.CANCELED,
        DeliveryStatus.DELIVERED,
        DeliveryStatus.INCOMPLETE,
      ];

      for (const status of statuses) {
        const validData = {
          deliveryDate: '2024-01-15T00:00:00.000Z',
          sourceDeliveryReceiptId: 456,
          toWarehouseId: 'warehouse-destination',
          status: status,
        };

        const dto = plainToInstance(CreateDeliveryDTO, validData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    it('should validate with different truck load stages', async () => {
      const stages = [
        TruckLoadStage.FOR_SECURING,
        TruckLoadStage.FOR_PACKING,
        TruckLoadStage.FOR_LOADING,
        TruckLoadStage.FOR_DELIVERY,
        TruckLoadStage.OUT_FOR_DELIVERY,
      ];

      for (const stage of stages) {
        const validData = {
          deliveryDate: '2024-01-15T00:00:00.000Z',
          sourceDeliveryReceiptId: 456,
          toWarehouseId: 'warehouse-destination',
          truckLoadStage: stage,
        };

        const dto = plainToInstance(CreateDeliveryDTO, validData);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });
  });
});
