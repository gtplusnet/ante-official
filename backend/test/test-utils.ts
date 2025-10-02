import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockPrismaService,
  createMockUtilityService,
  createMockEncryptionService,
  createMockTableHandlerService,
  createMockEventEmitter,
  createMockEmailService,
} from './setup';

/**
 * Create a testing module with common mocked services
 */
export async function createTestingModule(
  providers: any[] = [],
  customMocks: Record<string, any> = {},
): Promise<TestingModule> {
  const defaultMocks = {
    PrismaService: createMockPrismaService(),
    UtilityService: createMockUtilityService(),
    EncryptionService: createMockEncryptionService(),
    TableHandlerService: createMockTableHandlerService(),
    EventEmitter2: createMockEventEmitter(),
    EmailService: createMockEmailService(),
    ...customMocks,
  };

  const mockProviders = Object.entries(defaultMocks).map(
    ([token, useValue]) => ({
      provide: token,
      useValue,
    }),
  );

  const module: TestingModule = await Test.createTestingModule({
    providers: [...providers, ...mockProviders],
  }).compile();

  return module;
}

/**
 * Create a testing module for a specific service with its dependencies
 */
export async function createServiceTestingModule<T>(
  serviceClass: new (...args: any[]) => T,
  dependencies: Record<string, any> = {},
): Promise<{ module: TestingModule; service: T }> {
  const module = await createTestingModule([serviceClass], dependencies);

  const service = module.get<T>(serviceClass);
  return { module, service };
}

/**
 * Create a testing module for a controller with its dependencies
 */
export async function createControllerTestingModule<T>(
  controllerClass: new (...args: any[]) => T,
  dependencies: Record<string, any> = {},
): Promise<{ module: TestingModule; controller: T }> {
  const module = await createTestingModule([controllerClass], dependencies);

  const controller = module.get<T>(controllerClass);
  return { module, controller };
}

/**
 * Utility function to test error scenarios
 */
export async function expectThrowsAsync(
  fn: () => Promise<any>,
  expectedError?: string | RegExp | any,
): Promise<any> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect(error.message).toMatch(expectedError);
      } else if (typeof expectedError === 'function') {
        expect(error).toBeInstanceOf(expectedError);
      }
    }
    return error;
  }
}

/**
 * Mock HTTP headers for testing
 */
export const createMockHeaders = (overrides: Record<string, string> = {}) => ({
  'user-agent': 'test-agent',
  'content-type': 'application/json',
  authorization: 'Bearer test-token',
  ...overrides,
});

/**
 * Mock request object for testing controllers
 */
export const createMockRequest = (overrides: Record<string, any> = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    companyId: 'test-company-id',
  },
  headers: createMockHeaders(),
  ip: '127.0.0.1',
  body: {},
  params: {},
  query: {},
  ...overrides,
});

/**
 * Mock response object for testing controllers
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    cookie: jest.fn(() => res),
    clearCookie: jest.fn(() => res),
    redirect: jest.fn(() => res),
  };
  return res;
};

/**
 * Test data generator for Prisma entities
 */
export class TestDataGenerator {
  static createAccount(overrides: Partial<any> = {}) {
    return {
      id: 'test-account-' + Math.random().toString(36).substr(2, 9),
      email: `test-${Math.random().toString(36).substr(2, 5)}@example.com`,
      username: `testuser${Math.random().toString(36).substr(2, 5)}`,
      firstName: 'Test',
      lastName: 'User',
      password: 'encrypted-password',
      key: 'encryption-key',
      companyId: 'test-company-id',
      roleId: 'test-role-id',
      isActive: true,
      authProvider: 'LOCAL',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createCompany(overrides: Partial<any> = {}) {
    return {
      id: 'test-company-' + Math.random().toString(36).substr(2, 9),
      companyName: 'Test Company',
      domainPrefix: 'testcompany',
      businessType: 'OTHERS',
      industry: 'OTHERS',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTask(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      title: 'Test Task',
      description: 'Test task description',
      taskType: 'STANDARD',
      assignMode: 'SELF',
      isSelfAssigned: true,
      isOpen: true,
      order: 0,
      boardLaneId: 1,
      createdById: 'test-account-id',
      assignedToId: 'test-account-id',
      projectId: null,
      dueDate: null,
      startDate: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createEquipment(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      name: 'Test Equipment',
      serialCode: `EQ${Math.random().toString().substr(2, 6)}`,
      equipmentType: 'MACHINERY',
      brandId: 1,
      currentWarehouseId: 1,
      companyId: 'test-company-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createEquipmentPart(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000) + 1,
      partName: 'Test Part',
      equipmentId: 1,
      scheduleDay: 30,
      lastMaintenanceDate: new Date(),
      nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}

/**
 * Database transaction mock helper
 */
export const mockPrismaTransaction = (prismaService: any) => {
  const mockTransaction = jest.fn(async (callback) => {
    return callback(prismaService);
  });
  prismaService.$transaction = mockTransaction;
  return mockTransaction;
};

/**
 * Date testing utilities
 */
export const DateUtils = {
  /**
   * Check if two dates are approximately equal (within 1 second)
   */
  isApproximatelyEqual: (date1: Date, date2: Date, toleranceMs = 1000) => {
    return Math.abs(date1.getTime() - date2.getTime()) <= toleranceMs;
  },

  /**
   * Create a date relative to now
   */
  createRelativeDate: (daysFromNow: number) => {
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  },

  /**
   * Create a date range for testing
   */
  createDateRange: (startDaysFromNow: number, endDaysFromNow: number) => ({
    start: DateUtils.createRelativeDate(startDaysFromNow),
    end: DateUtils.createRelativeDate(endDaysFromNow),
  }),
};

/**
 * Async test utilities
 */
export const AsyncTestUtils = {
  /**
   * Wait for a specified time in tests
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Wait for a condition to be true
   */
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100,
  ) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await AsyncTestUtils.wait(intervalMs);
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },
};
