import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WarehouseType } from '@prisma/client';
import {
  WarehouseCreateDTO,
  WarehouseUpdateDTO,
  WarehouseReadDTO,
  WarehouseDeleteDTO,
} from './warehouse.validator';

describe('Warehouse Validator DTOs', () => {
  describe('WarehouseCreateDTO', () => {
    it('should validate a valid warehouse creation data', async () => {
      const validData = {
        name: 'Main Warehouse',
        locationId: 'location123',
        projectId: 1,
        capacity: 1000,
        warehouseType: WarehouseType.COMPANY_WAREHOUSE,
        equipmentId: 10,
      };

      const dto = plainToInstance(WarehouseCreateDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const invalidData = {};

      const dto = plainToInstance(WarehouseCreateDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);

      // Should have errors for required fields: name, capacity, warehouseType
      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('capacity');
      expect(errorProperties).toContain('warehouseType');
    });

    it('should fail validation when name is empty string', async () => {
      const invalidData = {
        name: '',
        capacity: 1000,
        warehouseType: WarehouseType.COMPANY_WAREHOUSE,
      };

      const dto = plainToInstance(WarehouseCreateDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((error) => error.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail validation when capacity is not a number', async () => {
      const invalidData = {
        name: 'Test Warehouse',
        capacity: 'not-a-number',
        warehouseType: WarehouseType.COMPANY_WAREHOUSE,
      };

      const dto = plainToInstance(WarehouseCreateDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const capacityError = errors.find(
        (error) => error.property === 'capacity',
      );
      expect(capacityError).toBeDefined();
    });

    it('should validate when optional fields are omitted', async () => {
      const validData = {
        name: 'Simple Warehouse',
        capacity: 500,
        warehouseType: WarehouseType.TEMPORARY_WAREHOUSE,
      };

      const dto = plainToInstance(WarehouseCreateDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('WarehouseUpdateDTO', () => {
    it('should validate when all optional fields are provided', async () => {
      const validData = {
        name: 'Updated Warehouse',
        locationId: 'location456',
        capacity: 2000,
      };

      const dto = plainToInstance(WarehouseUpdateDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate when no fields are provided (all optional)', async () => {
      const validData = {};

      const dto = plainToInstance(WarehouseUpdateDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when capacity is not a number', async () => {
      const invalidData = {
        capacity: 'not-a-number',
      };

      const dto = plainToInstance(WarehouseUpdateDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const capacityError = errors.find(
        (error) => error.property === 'capacity',
      );
      expect(capacityError).toBeDefined();
    });

    it('should validate when only name is provided', async () => {
      const validData = {
        name: 'New Name',
      };

      const dto = plainToInstance(WarehouseUpdateDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('WarehouseReadDTO', () => {
    it('should validate when id is provided', async () => {
      const validData = {
        id: 'warehouse123',
      };

      const dto = plainToInstance(WarehouseReadDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id is missing', async () => {
      const invalidData = {};

      const dto = plainToInstance(WarehouseReadDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });

    it('should fail validation when id is empty string', async () => {
      const invalidData = {
        id: '',
      };

      const dto = plainToInstance(WarehouseReadDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });
  });

  describe('WarehouseDeleteDTO', () => {
    it('should validate when id is provided', async () => {
      const validData = {
        id: 'warehouse456',
      };

      const dto = plainToInstance(WarehouseDeleteDTO, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id is missing', async () => {
      const invalidData = {};

      const dto = plainToInstance(WarehouseDeleteDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });

    it('should fail validation when id is empty string', async () => {
      const invalidData = {
        id: '',
      };

      const dto = plainToInstance(WarehouseDeleteDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });

    it('should fail validation when id is not a string', async () => {
      const invalidData = {
        id: 123,
      };

      const dto = plainToInstance(WarehouseDeleteDTO, invalidData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });
  });
});
