import { Test, TestingModule } from '@nestjs/testing';
import { ExcelTransformService } from './excel-transform.service';
import {
  ExcelTransformOptions,
  ExcelTransformMapping,
} from './interfaces/excel.interface';

describe('ExcelTransformService', () => {
  let service: ExcelTransformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelTransformService],
    }).compile();

    service = module.get<ExcelTransformService>(ExcelTransformService);
  });

  describe('transform', () => {
    it('should transform data based on mappings', () => {
      const data = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ];

      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'firstName', targetField: 'first_name' },
        { sourceColumn: 'lastName', targetField: 'last_name' },
        { sourceColumn: 'email', targetField: 'email_address' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
      });
      expect(result[1]).toEqual({
        first_name: 'Jane',
        last_name: 'Smith',
        email_address: 'jane@example.com',
      });
    });

    it('should skip empty rows when skipEmptyRows is true', () => {
      const data = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: '', lastName: '' },
        { firstName: null, lastName: null },
        { firstName: 'Jane', lastName: 'Smith' },
      ];

      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'firstName', targetField: 'first_name' },
        { sourceColumn: 'lastName', targetField: 'last_name' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: true,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result).toHaveLength(2);
      expect(result[0].first_name).toBe('John');
      expect(result[1].first_name).toBe('Jane');
    });

    it('should preserve original fields when preserveOriginal is true', () => {
      const data = [
        { firstName: 'John', lastName: 'Doe', originalField: 'original_value' },
      ];

      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'firstName', targetField: 'first_name' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: true,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        first_name: 'John',
        firstName: 'John',
        lastName: 'Doe',
        originalField: 'original_value',
      });
    });

    it('should apply transformer functions when provided', () => {
      const data = [
        { name: 'john doe', age: '25', active: 'yes' },
        { name: 'jane smith', age: '30', active: 'no' },
      ];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'name',
          targetField: 'full_name',
          transformer: (value) => value?.toString().toUpperCase(),
        },
        {
          sourceColumn: 'age',
          targetField: 'years',
          transformer: (value) => parseInt(value as string, 10),
        },
        {
          sourceColumn: 'active',
          targetField: 'is_active',
          transformer: (value) => value === 'yes',
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        full_name: 'JOHN DOE',
        years: 25,
        is_active: true,
      });
      expect(result[1]).toEqual({
        full_name: 'JANE SMITH',
        years: 30,
        is_active: false,
      });
    });

    it('should handle transformer functions with access to entire row', () => {
      const data = [
        { firstName: 'John', lastName: 'Doe', salary: 5000 },
        { firstName: 'Jane', lastName: 'Smith', salary: 6000 },
      ];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'firstName',
          targetField: 'display_name',
          transformer: (value, row) =>
            `${value} ${row.lastName} ($${row.salary})`,
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        display_name: 'John Doe ($5000)',
      });
      expect(result[1]).toEqual({
        display_name: 'Jane Smith ($6000)',
      });
    });

    it('should handle mappings with default values', () => {
      const data = [
        { firstName: 'John', lastName: null },
        { firstName: undefined, lastName: 'Smith' },
      ];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'firstName',
          targetField: 'first_name',
          defaultValue: 'Unknown',
        },
        {
          sourceColumn: 'lastName',
          targetField: 'last_name',
          defaultValue: 'Unknown',
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        first_name: 'John',
        last_name: 'Unknown',
      });
      expect(result[1]).toEqual({
        first_name: 'Unknown',
        last_name: 'Smith',
      });
    });

    it('should handle null and undefined values correctly', () => {
      const data = [{ field1: null, field2: undefined, field3: '' }];

      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'field1', targetField: 'target1' },
        { sourceColumn: 'field2', targetField: 'target2' },
        { sourceColumn: 'field3', targetField: 'target3' },
        { sourceColumn: 'nonexistent', targetField: 'target4' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      // null and undefined trigger defaultValue (which is undefined here)
      // empty string is preserved as it's not null/undefined
      expect(result[0]).toEqual({
        target1: undefined,
        target2: undefined,
        target3: '',
        target4: undefined,
      });
    });

    it('should handle empty mappings array', () => {
      const data = [{ firstName: 'John', lastName: 'Doe' }];

      const options: ExcelTransformOptions = {
        mappings: [],
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({});
    });

    it('should handle empty data array', () => {
      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'firstName', targetField: 'first_name' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform([], options);

      expect(result).toEqual([]);
    });

    it('should combine preserveOriginal with transformations', () => {
      const data = [{ original: 'value', transform: 'lower' }];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'transform',
          targetField: 'transformed',
          transformer: (value) => value?.toString().toUpperCase(),
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: true,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        transformed: 'LOWER',
        original: 'value',
        transform: 'lower',
      });
    });

    it('should handle complex nested transformations', () => {
      const data = [
        {
          user: { name: 'John', details: { age: 25 } },
          tags: ['admin', 'user'],
        },
      ];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'user',
          targetField: 'user_info',
          transformer: (value: any) => `${value.name} (${value.details.age})`,
        },
        {
          sourceColumn: 'tags',
          targetField: 'user_roles',
          transformer: (value: string[]) => value.join(', '),
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result[0]).toEqual({
        user_info: 'John (25)',
        user_roles: 'admin, user',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle transformer throwing errors gracefully', () => {
      const data = [{ field: 'value' }];

      const mappings: ExcelTransformMapping[] = [
        {
          sourceColumn: 'field',
          targetField: 'target',
          transformer: () => {
            throw new Error('Transformer error');
          },
        },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      expect(() => service.transform(data, options)).toThrow(
        'Transformer error',
      );
    });

    it('should handle mixed row structures', () => {
      const data = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', middleName: 'Anne', lastName: 'Smith' },
        { lastName: 'Johnson', phone: '123-456-7890' },
      ];

      const mappings: ExcelTransformMapping[] = [
        { sourceColumn: 'firstName', targetField: 'first' },
        { sourceColumn: 'lastName', targetField: 'last' },
        { sourceColumn: 'email', targetField: 'mail' },
      ];

      const options: ExcelTransformOptions = {
        mappings,
        skipEmptyRows: false,
        preserveOriginal: false,
      };

      const result = service.transform(data, options);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        first: 'John',
        last: 'Doe',
        mail: 'john@example.com',
      });
      expect(result[1]).toEqual({
        first: 'Jane',
        last: 'Smith',
        mail: undefined,
      });
      expect(result[2]).toEqual({
        first: undefined,
        last: 'Johnson',
        mail: undefined,
      });
    });
  });
});
