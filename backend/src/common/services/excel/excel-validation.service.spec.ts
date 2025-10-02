import { Test, TestingModule } from '@nestjs/testing';
import { ExcelValidationService } from './excel-validation.service';
import {
  ExcelValidationRule,
  ExcelValidationResult,
  ExcelValidationError,
  ExcelValidationWarning,
} from './interfaces/excel.interface';

describe('ExcelValidationService', () => {
  let service: ExcelValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelValidationService],
    }).compile();

    service = module.get<ExcelValidationService>(ExcelValidationService);
  });

  describe('isEmptyValue', () => {
    it('should identify empty values correctly', () => {
      expect((service as any).isEmptyValue(null)).toBe(true);
      expect((service as any).isEmptyValue(undefined)).toBe(true);
      expect((service as any).isEmptyValue('')).toBe(true);
      expect((service as any).isEmptyValue('   ')).toBe(true);
      expect((service as any).isEmptyValue('test')).toBe(false);
      expect((service as any).isEmptyValue(0)).toBe(false);
      expect((service as any).isEmptyValue(false)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses correctly', () => {
      expect((service as any).isValidEmail('test@example.com')).toBe(true);
      expect((service as any).isValidEmail('user.name@domain.co.uk')).toBe(
        true,
      );
      expect((service as any).isValidEmail('invalid-email')).toBe(false);
      expect((service as any).isValidEmail('missing@domain')).toBe(false);
      expect((service as any).isValidEmail('@domain.com')).toBe(false);
      expect((service as any).isValidEmail('test@')).toBe(false);
      expect((service as any).isValidEmail('')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate Date objects', () => {
      expect((service as any).isValidDate(new Date('2023-01-01'))).toBe(true);
      expect((service as any).isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should validate date strings', () => {
      expect((service as any).isValidDate('2023-01-01')).toBe(true);
      expect((service as any).isValidDate('01/01/2023')).toBe(true);
      expect((service as any).isValidDate('invalid-date')).toBe(false);
      expect((service as any).isValidDate('')).toBe(false);
    });

    it('should validate date numbers (timestamps)', () => {
      expect((service as any).isValidDate(1672531200000)).toBe(true); // Valid timestamp
      expect((service as any).isValidDate(NaN)).toBe(false);
    });
  });

  describe('validateField', () => {
    describe('required validation', () => {
      it('should pass when value is present', async () => {
        const rule: ExcelValidationRule = {
          field: 'name',
          type: 'required',
        };

        const result = await (service as any).validateField(
          'John',
          rule,
          {},
          2,
        );
        expect(result.error).toBeUndefined();
      });

      it('should fail when value is empty', async () => {
        const rule: ExcelValidationRule = {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        };

        const result = await (service as any).validateField('', rule, {}, 2);
        expect(result.error).toEqual({
          row: 2,
          column: 'name',
          value: '',
          message: 'Name is required',
          type: 'required',
        });
      });
    });

    describe('email validation', () => {
      it('should pass for valid email', async () => {
        const rule: ExcelValidationRule = {
          field: 'email',
          type: 'email',
        };

        const result = await (service as any).validateField(
          'test@example.com',
          rule,
          {},
          2,
        );
        expect(result.error).toBeUndefined();
      });

      it('should pass for empty email when not required', async () => {
        const rule: ExcelValidationRule = {
          field: 'email',
          type: 'email',
        };

        const result = await (service as any).validateField('', rule, {}, 2);
        expect(result.error).toBeUndefined();
      });

      it('should fail for invalid email', async () => {
        const rule: ExcelValidationRule = {
          field: 'email',
          type: 'email',
        };

        const result = await (service as any).validateField(
          'invalid-email',
          rule,
          {},
          2,
        );
        expect(result.error).toEqual({
          row: 2,
          column: 'email',
          value: 'invalid-email',
          message: 'email must be a valid email address',
          type: 'email',
        });
      });
    });

    describe('regex validation', () => {
      it('should pass when value matches pattern', async () => {
        const rule: ExcelValidationRule = {
          field: 'phone',
          type: 'regex',
          pattern: /^\d{3}-\d{3}-\d{4}$/,
        };

        const result = await (service as any).validateField(
          '123-456-7890',
          rule,
          {},
          2,
        );
        expect(result.error).toBeUndefined();
      });

      it('should fail when value does not match pattern', async () => {
        const rule: ExcelValidationRule = {
          field: 'phone',
          type: 'regex',
          pattern: /^\d{3}-\d{3}-\d{4}$/,
          message: 'Invalid phone format',
        };

        const result = await (service as any).validateField(
          'invalid-phone',
          rule,
          {},
          2,
        );
        expect(result.error).toEqual({
          row: 2,
          column: 'phone',
          value: 'invalid-phone',
          message: 'Invalid phone format',
          type: 'regex',
        });
      });
    });

    describe('date validation', () => {
      it('should pass for valid date', async () => {
        const rule: ExcelValidationRule = {
          field: 'birthDate',
          type: 'date',
        };

        const result = await (service as any).validateField(
          '2023-01-01',
          rule,
          {},
          2,
        );
        expect(result.error).toBeUndefined();
      });

      it('should fail for invalid date', async () => {
        const rule: ExcelValidationRule = {
          field: 'birthDate',
          type: 'date',
        };

        const result = await (service as any).validateField(
          'invalid-date',
          rule,
          {},
          2,
        );
        expect(result.error).toEqual({
          row: 2,
          column: 'birthDate',
          value: 'invalid-date',
          message: 'birthDate must be a valid date',
          type: 'date',
        });
      });
    });

    describe('number validation', () => {
      it('should pass for valid number', async () => {
        const rule: ExcelValidationRule = {
          field: 'age',
          type: 'number',
        };

        const result = await (service as any).validateField('25', rule, {}, 2);
        expect(result.error).toBeUndefined();
      });

      it('should fail for non-number value', async () => {
        const rule: ExcelValidationRule = {
          field: 'age',
          type: 'number',
        };

        const result = await (service as any).validateField(
          'not-a-number',
          rule,
          {},
          2,
        );
        expect(result.error).toEqual({
          row: 2,
          column: 'age',
          value: 'not-a-number',
          message: 'age must be a number',
          type: 'number',
        });
      });

      it('should validate minimum value', async () => {
        const rule: ExcelValidationRule = {
          field: 'age',
          type: 'number',
          min: 18,
        };

        const result = await (service as any).validateField('16', rule, {}, 2);
        expect(result.error).toEqual({
          row: 2,
          column: 'age',
          value: '16',
          message: 'age must be at least 18',
          type: 'number',
        });
      });

      it('should validate maximum value', async () => {
        const rule: ExcelValidationRule = {
          field: 'age',
          type: 'number',
          max: 65,
        };

        const result = await (service as any).validateField('70', rule, {}, 2);
        expect(result.error).toEqual({
          row: 2,
          column: 'age',
          value: '70',
          message: 'age must be at most 65',
          type: 'number',
        });
      });

      it('should pass for empty value', async () => {
        const rule: ExcelValidationRule = {
          field: 'age',
          type: 'number',
        };

        const result = await (service as any).validateField('', rule, {}, 2);
        expect(result.error).toBeUndefined();
      });
    });

    describe('custom validation', () => {
      it('should pass when custom validator returns true', async () => {
        const rule: ExcelValidationRule = {
          field: 'customField',
          type: 'custom',
          validator: jest.fn().mockResolvedValue(true),
        };

        const result = await (service as any).validateField(
          'test',
          rule,
          { other: 'data' },
          2,
        );
        expect(result.error).toBeUndefined();
        expect(rule.validator).toHaveBeenCalledWith('test', { other: 'data' });
      });

      it('should fail when custom validator returns false', async () => {
        const rule: ExcelValidationRule = {
          field: 'customField',
          type: 'custom',
          validator: jest.fn().mockResolvedValue(false),
          message: 'Custom validation failed',
        };

        const result = await (service as any).validateField(
          'test',
          rule,
          {},
          2,
        );
        expect(result.error).toEqual({
          row: 2,
          column: 'customField',
          value: 'test',
          message: 'Custom validation failed',
          type: 'custom',
        });
      });
    });
  });

  describe('validateUniqueness', () => {
    it('should pass when all values are unique', async () => {
      const data = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { email: 'user3@example.com' },
      ];
      const rules: ExcelValidationRule[] = [{ field: 'email', type: 'unique' }];

      const errors = await (service as any).validateUniqueness(data, rules);
      expect(errors).toHaveLength(0);
    });

    it('should fail when duplicate values exist', async () => {
      const data = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { email: 'USER1@EXAMPLE.COM' }, // Case insensitive duplicate
      ];
      const rules: ExcelValidationRule[] = [
        { field: 'email', type: 'unique', message: 'Email must be unique' },
      ];

      const errors = await (service as any).validateUniqueness(data, rules);
      expect(errors).toHaveLength(2); // Both duplicate entries should have errors
      expect(errors[0]).toEqual({
        row: 2,
        column: 'email',
        value: 'user1@example.com',
        message: 'Email must be unique',
        type: 'unique',
      });
      expect(errors[1]).toEqual({
        row: 4,
        column: 'email',
        value: 'USER1@EXAMPLE.COM',
        message: 'Email must be unique',
        type: 'unique',
      });
    });

    it('should ignore empty values in uniqueness check', async () => {
      const data = [
        { email: '' },
        { email: null },
        { email: undefined },
        { email: 'user@example.com' },
      ];
      const rules: ExcelValidationRule[] = [{ field: 'email', type: 'unique' }];

      const errors = await (service as any).validateUniqueness(data, rules);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate data successfully with no errors', async () => {
      const data = [
        { name: 'John', email: 'john@example.com', age: 25 },
        { name: 'Jane', email: 'jane@example.com', age: 30 },
      ];
      const rules: ExcelValidationRule[] = [
        { field: 'name', type: 'required' },
        { field: 'email', type: 'email' },
        { field: 'age', type: 'number', min: 18 },
      ];

      const result = await service.validate(data, rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows).toHaveLength(2);
      expect(result.invalidRows).toHaveLength(0);
    });

    it('should validate data with errors', async () => {
      const data = [
        { name: '', email: 'invalid-email', age: 'not-a-number' },
        { name: 'Jane', email: 'jane@example.com', age: 16 },
      ];
      const rules: ExcelValidationRule[] = [
        { field: 'name', type: 'required' },
        { field: 'email', type: 'email' },
        { field: 'age', type: 'number', min: 18 },
      ];

      const result = await service.validate(data, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(2);
    });

    it('should include uniqueness validation', async () => {
      const data = [
        { email: 'duplicate@example.com' },
        { email: 'duplicate@example.com' },
      ];
      const rules: ExcelValidationRule[] = [{ field: 'email', type: 'unique' }];

      const result = await service.validate(data, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe('unique');
      expect(result.errors[1].type).toBe('unique');
    });
  });

  describe('createRulesFromColumns', () => {
    it('should create validation rules from column definitions', () => {
      const columns = [
        {
          key: 'name',
          required: true,
          type: 'text' as const,
        },
        {
          key: 'email',
          required: true,
          type: 'email' as const,
          unique: true,
        },
        {
          key: 'age',
          type: 'number' as const,
          min: 18,
          max: 65,
        },
        {
          key: 'birthDate',
          type: 'date' as const,
        },
        {
          key: 'phone',
          pattern: /^\d{3}-\d{3}-\d{4}$/,
        },
      ];

      const rules = service.createRulesFromColumns(columns);

      expect(rules).toHaveLength(7); // name(1) + email(2) + age(1) + birthDate(1) + phone(1) + unique(1)

      const nameRequired = rules.find(
        (r) => r.field === 'name' && r.type === 'required',
      );
      expect(nameRequired).toBeDefined();

      const emailRequired = rules.find(
        (r) => r.field === 'email' && r.type === 'required',
      );
      const emailType = rules.find(
        (r) => r.field === 'email' && r.type === 'email',
      );
      const emailUnique = rules.find(
        (r) => r.field === 'email' && r.type === 'unique',
      );
      expect(emailRequired).toBeDefined();
      expect(emailType).toBeDefined();
      expect(emailUnique).toBeDefined();

      const ageNumber = rules.find(
        (r) => r.field === 'age' && r.type === 'number',
      );
      expect(ageNumber).toBeDefined();
      expect(ageNumber?.min).toBe(18);
      expect(ageNumber?.max).toBe(65);

      const birthDateRule = rules.find(
        (r) => r.field === 'birthDate' && r.type === 'date',
      );
      expect(birthDateRule).toBeDefined();

      const phonePattern = rules.find(
        (r) => r.field === 'phone' && r.type === 'regex',
      );
      expect(phonePattern).toBeDefined();
      expect(phonePattern?.pattern).toEqual(/^\d{3}-\d{3}-\d{4}$/);
    });
  });

  describe('groupErrorsByRow', () => {
    it('should group errors by row number', () => {
      const errors: ExcelValidationError[] = [
        {
          row: 2,
          column: 'name',
          value: '',
          message: 'Required',
          type: 'required',
        },
        {
          row: 2,
          column: 'email',
          value: 'invalid',
          message: 'Invalid email',
          type: 'email',
        },
        {
          row: 3,
          column: 'age',
          value: 'abc',
          message: 'Must be number',
          type: 'number',
        },
      ];

      const grouped = (service as any).groupErrorsByRow(errors);

      expect(grouped.size).toBe(2);
      expect(grouped.get(2)).toHaveLength(2);
      expect(grouped.get(3)).toHaveLength(1);
    });
  });

  describe('groupWarningsByRow', () => {
    it('should group warnings by row number', () => {
      const warnings: ExcelValidationWarning[] = [
        {
          row: 2,
          column: 'name',
          value: 'test',
          message: 'Warning 1',
          type: 'custom',
        },
        {
          row: 2,
          column: 'email',
          value: 'test@example.com',
          message: 'Warning 2',
          type: 'custom',
        },
        {
          row: 3,
          column: 'age',
          value: 25,
          message: 'Warning 3',
          type: 'custom',
        },
      ];

      const grouped = (service as any).groupWarningsByRow(warnings);

      expect(grouped.size).toBe(2);
      expect(grouped.get(2)).toHaveLength(2);
      expect(grouped.get(3)).toHaveLength(1);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate a validation report with errors and warnings', () => {
      const result: ExcelValidationResult = {
        isValid: false,
        errors: [
          {
            row: 2,
            column: 'name',
            value: '',
            message: 'Name is required',
            type: 'required',
          },
          {
            row: 2,
            column: 'email',
            value: 'invalid',
            message: 'Invalid email',
            type: 'email',
          },
        ],
        warnings: [
          {
            row: 3,
            column: 'age',
            value: 17,
            message: 'Age below 18',
            type: 'custom',
          },
        ],
        validRows: [{ name: 'John', email: 'john@example.com' }],
        invalidRows: [
          {
            rowNumber: 2,
            data: { name: '', email: 'invalid' },
            errors: [
              {
                row: 2,
                column: 'name',
                value: '',
                message: 'Name is required',
                type: 'required',
              },
              {
                row: 2,
                column: 'email',
                value: 'invalid',
                message: 'Invalid email',
                type: 'email',
              },
            ],
          },
        ],
      };

      const report = service.generateValidationReport(result);

      expect(report).toContain('Excel Validation Report');
      expect(report).toContain('Total Rows: 2');
      expect(report).toContain('Valid Rows: 1');
      expect(report).toContain('Invalid Rows: 1');
      expect(report).toContain('Errors:');
      expect(report).toContain('Row 2:');
      expect(report).toContain('- name: Name is required');
      expect(report).toContain('- email: Invalid email');
      expect(report).toContain('Warnings:');
      expect(report).toContain('Row 3:');
      expect(report).toContain('- age: Age below 18');
    });

    it('should generate a validation report without errors or warnings', () => {
      const result: ExcelValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        validRows: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' },
        ],
        invalidRows: [],
      };

      const report = service.generateValidationReport(result);

      expect(report).toContain('Excel Validation Report');
      expect(report).toContain('Total Rows: 2');
      expect(report).toContain('Valid Rows: 2');
      expect(report).toContain('Invalid Rows: 0');
      expect(report).not.toContain('Errors:');
      expect(report).not.toContain('Warnings:');
    });
  });
});
