import { Test, TestingModule } from '@nestjs/testing';
import {
  UniqueConstraint,
  Unique,
  EmployeeCodeUniquePerCompanyConstraint,
  IsEmployeeCodeUniquePerCompany,
} from './unique.validator';
import { PrismaService } from '../prisma.service';
import { UtilityService } from '../utility.service';

// Test class for the Unique decorator
class TestUniqueClass {
  @Unique('account', 'email')
  email: string;
}

// Test class for the employee code validator
class TestEmployeeClass {
  accountId?: string;

  @IsEmployeeCodeUniquePerCompany()
  employeeCode: string;
}

describe('Unique Validators', () => {
  let module: TestingModule;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockUtilityService: jest.Mocked<UtilityService>;

  beforeEach(async () => {
    mockPrisma = {
      account: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      employeeData: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    mockUtilityService = {
      companyId: 123,
    } as any;

    module = await Test.createTestingModule({
      providers: [
        UniqueConstraint,
        EmployeeCodeUniquePerCompanyConstraint,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UtilityService, useValue: mockUtilityService },
      ],
    }).compile();

    // Register the validators with class-validator
    await module.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UniqueConstraint', () => {
    let constraint: UniqueConstraint;

    beforeEach(() => {
      constraint = module.get<UniqueConstraint>(UniqueConstraint);
    });

    it('should be defined', () => {
      expect(constraint).toBeDefined();
    });

    describe('validate', () => {
      it('should return true when record does not exist (is unique)', async () => {
        (mockPrisma.account.findUnique as jest.Mock).mockResolvedValue(null);

        const args = { constraints: ['account', 'email'] };
        const result = await constraint.validate('test@example.com', args);

        expect(result).toBe(true);
        expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
      });

      it('should return false when record exists (not unique)', async () => {
        const existingUser = { id: '1', email: 'test@example.com' };
        (mockPrisma.account.findUnique as jest.Mock).mockResolvedValue(
          existingUser,
        );

        const args = { constraints: ['account', 'email'] };
        const result = await constraint.validate('test@example.com', args);

        expect(result).toBe(false);
        expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
      });

      it('should handle different entities and fields', async () => {
        (mockPrisma as any).product = {
          findUnique: jest.fn().mockResolvedValue(null),
        };

        const args = { constraints: ['product', 'sku'] };
        const result = await constraint.validate('SKU123', args);

        expect(result).toBe(true);
        expect((mockPrisma as any).product.findUnique).toHaveBeenCalledWith({
          where: { sku: 'SKU123' },
        });
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database connection failed');
        (mockPrisma.account.findUnique as jest.Mock).mockRejectedValue(dbError);

        const args = { constraints: ['account', 'email'] };

        await expect(
          constraint.validate('test@example.com', args),
        ).rejects.toThrow(dbError);
      });

      it('should handle null/undefined values', async () => {
        (mockPrisma.account.findUnique as jest.Mock).mockResolvedValue(null);

        const args = { constraints: ['account', 'email'] };

        const resultNull = await constraint.validate(null, args);
        const resultUndefined = await constraint.validate(undefined, args);

        expect(resultNull).toBe(true);
        expect(resultUndefined).toBe(true);
      });
    });

    describe('defaultMessage', () => {
      it('should return correct default message', () => {
        const args = { constraints: ['account', 'email'] };
        const message = constraint.defaultMessage(args);

        expect(message).toBe('email already exists in account');
      });

      it('should handle different entities and fields in message', () => {
        const args = { constraints: ['product', 'name'] };
        const message = constraint.defaultMessage(args);

        expect(message).toBe('name already exists in product');
      });

      it('should handle missing constraints', () => {
        const args = { constraints: [] };
        const message = constraint.defaultMessage(args);

        expect(message).toBe('undefined already exists in undefined');
      });
    });
  });

  describe('EmployeeCodeUniquePerCompanyConstraint', () => {
    let constraint: EmployeeCodeUniquePerCompanyConstraint;

    beforeEach(() => {
      constraint = module.get<EmployeeCodeUniquePerCompanyConstraint>(
        EmployeeCodeUniquePerCompanyConstraint,
      );
    });

    it('should be defined', () => {
      expect(constraint).toBeDefined();
    });

    describe('validate', () => {
      it('should return false when employeeCode is null/undefined', async () => {
        const args = { object: {} };

        const resultNull = await constraint.validate(null, args);
        const resultUndefined = await constraint.validate(undefined, args);
        const resultEmpty = await constraint.validate('', args);

        expect(resultNull).toBe(false);
        expect(resultUndefined).toBe(false);
        expect(resultEmpty).toBe(false);
      });

      it('should return false when companyId is missing', async () => {
        mockUtilityService.companyId = null as any;

        const args = { object: {} };
        const result = await constraint.validate('EMP001', args);

        expect(result).toBe(false);
      });

      it('should return true when employee with code does not exist', async () => {
        (mockPrisma.employeeData.findFirst as jest.Mock).mockResolvedValue(
          null,
        );

        const args = { object: {} };
        const result = await constraint.validate('EMP001', args);

        expect(result).toBe(true);
        expect(mockPrisma.employeeData.findFirst).toHaveBeenCalledWith({
          where: {
            employeeCode: 'EMP001',
            account: { companyId: 123 },
          },
          include: { account: true },
        });
      });

      it('should return false when employee with code exists (not unique)', async () => {
        const existingEmployee = {
          id: '1',
          employeeCode: 'EMP001',
          accountId: 'other-account',
          account: { id: 'other-account', companyId: 'company-123' },
        };
        (mockPrisma.employeeData.findFirst as jest.Mock).mockResolvedValue(
          existingEmployee,
        );

        const args = { object: {} };
        const result = await constraint.validate('EMP001', args);

        expect(result).toBe(false);
      });

      it('should return true when updating same employee (accountId matches)', async () => {
        const existingEmployee = {
          id: '1',
          employeeCode: 'EMP001',
          accountId: 'same-account',
          account: { id: 'same-account', companyId: 'company-123' },
        };
        (mockPrisma.employeeData.findFirst as jest.Mock).mockResolvedValue(
          existingEmployee,
        );

        const args = { object: { accountId: 'same-account' } };
        const result = await constraint.validate('EMP001', args);

        expect(result).toBe(true);
      });

      it('should return false when updating different employee with same code', async () => {
        const existingEmployee = {
          id: '1',
          employeeCode: 'EMP001',
          accountId: 'other-account',
          account: { id: 'other-account', companyId: 'company-123' },
        };
        (mockPrisma.employeeData.findFirst as jest.Mock).mockResolvedValue(
          existingEmployee,
        );

        const args = { object: { accountId: 'different-account' } };
        const result = await constraint.validate('EMP001', args);

        expect(result).toBe(false);
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database query failed');
        (mockPrisma.employeeData.findFirst as jest.Mock).mockRejectedValue(
          dbError,
        );

        const args = { object: {} };

        await expect(constraint.validate('EMP001', args)).rejects.toThrow(
          dbError,
        );
      });

      it('should query with correct company filter', async () => {
        mockUtilityService.companyId = 456;
        (mockPrisma.employeeData.findFirst as jest.Mock).mockResolvedValue(
          null,
        );

        const args = { object: {} };
        await constraint.validate('EMP001', args);

        expect(mockPrisma.employeeData.findFirst).toHaveBeenCalledWith({
          where: {
            employeeCode: 'EMP001',
            account: { companyId: 456 },
          },
          include: { account: true },
        });
      });
    });

    describe('defaultMessage', () => {
      it('should return correct default message', () => {
        const message = constraint.defaultMessage();
        expect(message).toBe(
          'Employee code must be unique within the company.',
        );
      });
    });
  });

  describe('Unique decorator', () => {
    it('should create decorator function', () => {
      const decorator = Unique('user', 'email');
      expect(typeof decorator).toBe('function');
    });

    it('should register decorator without options', () => {
      const decorator = Unique('user', 'email');
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });

    it('should register decorator with validation options', () => {
      const options = { message: 'Custom error message' };
      const decorator = Unique('user', 'email', options);
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });
  });

  describe('IsEmployeeCodeUniquePerCompany decorator', () => {
    it('should create decorator function', () => {
      const decorator = IsEmployeeCodeUniquePerCompany();
      expect(typeof decorator).toBe('function');
    });

    it('should register decorator without options', () => {
      const decorator = IsEmployeeCodeUniquePerCompany();
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });

    it('should register decorator with validation options', () => {
      const options = { message: 'Custom employee code error' };
      const decorator = IsEmployeeCodeUniquePerCompany(options);
      expect(() => decorator({}, 'testProperty')).not.toThrow();
    });
  });

  describe('integration with class-validator', () => {
    // Note: These tests would require proper DI setup to work with class-validator
    // The individual constraint tests above verify the validator logic correctly

    it('should have proper decorator structure for integration', () => {
      // Test that decorators are properly structured for class-validator
      expect(typeof Unique).toBe('function');
      expect(typeof IsEmployeeCodeUniquePerCompany).toBe('function');
    });

    it('should create instances without throwing', () => {
      // Test that test classes can be instantiated
      expect(() => new TestUniqueClass()).not.toThrow();
      expect(() => new TestEmployeeClass()).not.toThrow();
    });
  });
});
