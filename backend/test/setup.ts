import { Test, TestingModule } from '@nestjs/testing';

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'test-db-url';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SERVER_NAME = 'TEST';

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods during tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Test utility functions
export async function setupTestModule(
  providers: any[],
): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    providers,
  }).compile();

  return moduleRef;
}

// Mock factory functions
export const createMockPrismaService = () => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  setEventEmitter: jest.fn(),
  account: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  accountToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  company: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  task: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  equipment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  equipmentParts: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  equipmentPartsItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  equipmentPartsMaintenanceHistory: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  equipmentBrand: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  purchaseOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  warehouse: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  payrollFiling: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

export const createMockUtilityService = () => ({
  randomString: jest.fn(() => 'mock-random-string'),
  log: jest.fn(),
  formatDate: jest.fn((date) => date?.toISOString?.() || date),
  errorResponse: jest.fn(),
  responseHandler: jest.fn(),
  setAccountInformation: jest.fn(),
  companyId: 'test-company-id',
  accountInformation: {
    id: 'test-account-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  },
});

export const createMockEncryptionService = () => ({
  encrypt: jest.fn((data) => ({
    encrypted: `encrypted-${data}`,
    key: 'mock-key',
  })),
  decrypt: jest.fn((encrypted, _key) => encrypted.replace('encrypted-', '')),
  hashPassword: jest.fn((password) => `hashed-${password}`),
  comparePassword: jest.fn((password, hash) => hash === `hashed-${password}`),
});

export const createMockTableHandlerService = () => ({
  initialize: jest.fn(),
  constructTableQuery: jest.fn(() => ({
    where: {},
    include: {},
    orderBy: {},
    skip: 0,
    take: 10,
  })),
  getTableData: jest.fn(() => ({
    list: [],
    currentPage: 1,
    pagination: {
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      currentPage: 1,
    },
  })),
});

export const createMockEventEmitter = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
});

export const createMockEmailService = () => ({
  sendEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
});

// Test data factories
export const createMockAccount = (overrides: Partial<any> = {}) => ({
  id: 'test-account-id',
  email: 'test@example.com',
  username: 'testuser',
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
  company: {
    id: 'test-company-id',
    companyName: 'Test Company',
    isActive: true,
  },
  ...overrides,
});

export const createMockTask = (overrides: Partial<any> = {}) => ({
  id: 1,
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
});

export const createMockEquipment = (overrides: Partial<any> = {}) => ({
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
  },
  ...overrides,
});

// Clean up utilities
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

// Error assertions
export const expectError = async (
  promise: Promise<any>,
  errorMessage?: string,
) => {
  try {
    await promise;
    throw new Error('Expected promise to reject but it resolved');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
    return error;
  }
};

// Global test utilities
export const mockHeaders = {
  'user-agent': 'test-user-agent',
};

export const mockIpAddress = '127.0.0.1';

export const createMockRequest = (overrides: any = {}) => ({
  headers: mockHeaders,
  ip: mockIpAddress,
  body: {},
  params: {},
  query: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res;
};
