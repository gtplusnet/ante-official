import { Test, TestingModule } from '@nestjs/testing';
import { DeveloperAccountController } from './developer-account.controller';
import { DeveloperAccountService } from './developer-account.service';
import { UtilityService } from '@common/utility.service';
import {
  DeveloperAccountGetDTO,
  DeveloperAccountCreateDTO,
  DeveloperAccountUpdateDTO,
  DeveloperAccountDeleteDTO,
} from './developer-account.validator';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { Response } from 'express';

describe('DeveloperAccountController', () => {
  let controller: DeveloperAccountController;
  let developerAccountService: DeveloperAccountService;
  let utilityService: UtilityService;
  let mockResponse: Partial<Response>;

  const mockDeveloperAccountService = {
    getDeveloperAccount: jest.fn(),
    developerAccountTable: jest.fn(),
    createDeveloperAccount: jest.fn(),
    updateDeveloperAccount: jest.fn(),
    deleteDeveloperAccount: jest.fn(),
    toggleDeveloperStatus: jest.fn(),
    getCompanies: jest.fn(),
    getRoles: jest.fn(),
    loginAsUser: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn(),
    accountInformation: {
      isDeveloper: true,
      id: 'mock-user-id',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset utility service account information to default
    mockUtilityService.accountInformation = {
      isDeveloper: true,
      id: 'mock-user-id',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeveloperAccountController],
      providers: [
        {
          provide: DeveloperAccountService,
          useValue: mockDeveloperAccountService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<DeveloperAccountController>(
      DeveloperAccountController,
    );
    developerAccountService = module.get<DeveloperAccountService>(
      DeveloperAccountService,
    );
    utilityService = module.get<UtilityService>(UtilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have developer account service injected', () => {
    expect(controller.developerAccountService).toBeDefined();
    expect(controller.developerAccountService).toBe(developerAccountService);
  });

  it('should have utility service injected', () => {
    expect(controller.utility).toBeDefined();
    expect(controller.utility).toBe(utilityService);
  });

  describe('get', () => {
    it('should get developer account successfully', async () => {
      const params: DeveloperAccountGetDTO = {
        id: 'test-uuid-123',
      };

      const mockResult = Promise.resolve({
        id: 'test-uuid-123',
        email: 'dev@example.com',
        firstName: 'John',
        lastName: 'Developer',
        isDeveloper: true,
      });

      mockDeveloperAccountService.getDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.get(mockResponse, params);

      expect(
        mockDeveloperAccountService.getDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle get developer account with valid UUID', async () => {
      const params: DeveloperAccountGetDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockResult = Promise.resolve({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'another.dev@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isDeveloper: true,
      });

      mockDeveloperAccountService.getDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.get(mockResponse, params);

      expect(
        mockDeveloperAccountService.getDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('table', () => {
    it('should handle table request successfully', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableResult = Promise.resolve({
        data: [
          {
            id: 'uuid-1',
            email: 'dev1@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          {
            id: 'uuid-2',
            email: 'dev2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 10,
      });

      mockDeveloperAccountService.developerAccountTable.mockReturnValue(
        mockTableResult,
      );

      await controller.table(mockResponse, query, body);

      expect(
        mockDeveloperAccountService.developerAccountTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });

    it('should handle table request with filters', async () => {
      const query: TableQueryDTO = {
        page: 2,
        perPage: 20,
      };

      const body: TableBodyDTO = {
        filters: [{ isDeveloper: true }],
        settings: {},
        searchKeyword: 'john',
      };

      const mockTableResult = Promise.resolve({
        data: [
          {
            id: 'uuid-3',
            email: 'john.dev@example.com',
            firstName: 'John',
            lastName: 'Developer',
          },
        ],
        totalCount: 1,
        page: 2,
        pageSize: 20,
      });

      mockDeveloperAccountService.developerAccountTable.mockReturnValue(
        mockTableResult,
      );

      await controller.table(mockResponse, query, body);

      expect(
        mockDeveloperAccountService.developerAccountTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });

    it('should handle empty table request', async () => {
      const query: TableQueryDTO = {
        page: 1,
        perPage: 10,
      };

      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      const mockTableResult = Promise.resolve({
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
      });

      mockDeveloperAccountService.developerAccountTable.mockReturnValue(
        mockTableResult,
      );

      await controller.table(mockResponse, query, body);

      expect(
        mockDeveloperAccountService.developerAccountTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockTableResult,
        mockResponse,
      );
    });
  });

  describe('add', () => {
    it('should create developer account successfully', async () => {
      const params: DeveloperAccountCreateDTO = {
        email: 'newdev@example.com',
        firstName: 'New',
        lastName: 'Developer',
        contactNumber: '+1234567890',
        username: 'newdev',
        password: 'securepassword123',
        roleId: 'role-uuid-123',
        companyId: 1,
        isDeveloper: true,
      };

      const mockResult = Promise.resolve({
        success: true,
        id: 'new-uuid-123',
        message: 'Developer account created successfully',
      });

      mockDeveloperAccountService.createDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.add(mockResponse, params);

      expect(
        mockDeveloperAccountService.createDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should create developer account with optional fields', async () => {
      const params: DeveloperAccountCreateDTO = {
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'User',
        contactNumber: '+9876543210',
        username: 'minuser',
        password: 'password123',
        roleId: 'role-uuid-456',
      };

      const mockResult = Promise.resolve({
        success: true,
        id: 'minimal-uuid-456',
        message: 'Account created successfully',
      });

      mockDeveloperAccountService.createDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.add(mockResponse, params);

      expect(
        mockDeveloperAccountService.createDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should create developer account with middle name', async () => {
      const params: DeveloperAccountCreateDTO = {
        email: 'full.name@example.com',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        contactNumber: '+1122334455',
        username: 'johnmdoe',
        password: 'strongpassword456',
        roleId: 'role-uuid-789',
        companyId: 2,
        isDeveloper: false,
      };

      const mockResult = Promise.resolve({
        success: true,
        id: 'fullname-uuid-789',
        message: 'Account with full name created successfully',
      });

      mockDeveloperAccountService.createDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.add(mockResponse, params);

      expect(
        mockDeveloperAccountService.createDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('update', () => {
    it('should update developer account successfully', async () => {
      const params: DeveloperAccountUpdateDTO = {
        id: 'update-uuid-123',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Developer account updated successfully',
      });

      mockDeveloperAccountService.updateDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.update(mockResponse, params);

      expect(
        mockDeveloperAccountService.updateDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should update developer account with all fields', async () => {
      const params: DeveloperAccountUpdateDTO = {
        id: 'full-update-uuid-456',
        email: 'fully.updated@example.com',
        firstName: 'Fully',
        lastName: 'Updated',
        middleName: 'Middle',
        contactNumber: '+9999888877',
        username: 'fullyupdated',
        password: 'newpassword789',
        roleId: 'new-role-uuid-123',
        companyId: 3,
        isDeveloper: true,
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Account fully updated successfully',
      });

      mockDeveloperAccountService.updateDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.update(mockResponse, params);

      expect(
        mockDeveloperAccountService.updateDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should update developer account with only ID', async () => {
      const params: DeveloperAccountUpdateDTO = {
        id: 'minimal-update-uuid-789',
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Minimal update completed',
      });

      mockDeveloperAccountService.updateDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.update(mockResponse, params);

      expect(
        mockDeveloperAccountService.updateDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('delete', () => {
    it('should delete developer account successfully', async () => {
      const params: DeveloperAccountDeleteDTO = {
        id: 'delete-uuid-123',
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Developer account deleted successfully',
      });

      mockDeveloperAccountService.deleteDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.delete(mockResponse, params);

      expect(
        mockDeveloperAccountService.deleteDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle delete with different UUID format', async () => {
      const params: DeveloperAccountDeleteDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockResult = Promise.resolve({
        success: true,
        message: 'Account deleted successfully',
      });

      mockDeveloperAccountService.deleteDeveloperAccount.mockReturnValue(
        mockResult,
      );

      await controller.delete(mockResponse, params);

      expect(
        mockDeveloperAccountService.deleteDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('toggleDeveloper', () => {
    it('should toggle developer status successfully', async () => {
      const params = { accountId: 'toggle-uuid-123' };

      const mockResult = Promise.resolve({
        success: true,
        isDeveloper: true,
        message: 'Developer status toggled successfully',
      });

      mockDeveloperAccountService.toggleDeveloperStatus.mockReturnValue(
        mockResult,
      );

      await controller.toggleDeveloper(mockResponse, params);

      expect(
        mockDeveloperAccountService.toggleDeveloperStatus,
      ).toHaveBeenCalledWith(params.accountId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle toggle with different account ID', async () => {
      const params = { accountId: 'another-toggle-uuid-456' };

      const mockResult = Promise.resolve({
        success: true,
        isDeveloper: false,
        message: 'Developer status disabled',
      });

      mockDeveloperAccountService.toggleDeveloperStatus.mockReturnValue(
        mockResult,
      );

      await controller.toggleDeveloper(mockResponse, params);

      expect(
        mockDeveloperAccountService.toggleDeveloperStatus,
      ).toHaveBeenCalledWith(params.accountId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('getCompanies', () => {
    it('should get companies successfully', async () => {
      const mockResult = Promise.resolve({
        data: [
          { id: 1, name: 'Company A', status: 'active' },
          { id: 2, name: 'Company B', status: 'active' },
          { id: 3, name: 'Company C', status: 'inactive' },
        ],
      });

      mockDeveloperAccountService.getCompanies.mockReturnValue(mockResult);

      await controller.getCompanies(mockResponse);

      expect(mockDeveloperAccountService.getCompanies).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle empty companies list', async () => {
      const mockResult = Promise.resolve({
        data: [],
      });

      mockDeveloperAccountService.getCompanies.mockReturnValue(mockResult);

      await controller.getCompanies(mockResponse);

      expect(mockDeveloperAccountService.getCompanies).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('getRoles', () => {
    it('should get roles without company ID', async () => {
      const mockResult = Promise.resolve({
        data: [
          { id: 'role-1', name: 'Admin', permissions: ['all'] },
          { id: 'role-2', name: 'User', permissions: ['read'] },
        ],
      });

      mockDeveloperAccountService.getRoles.mockReturnValue(mockResult);

      await controller.getRoles(mockResponse);

      expect(mockDeveloperAccountService.getRoles).toHaveBeenCalledWith(
        undefined,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should get roles with company ID as string', async () => {
      const companyId = '5';
      const mockResult = Promise.resolve({
        data: [
          { id: 'role-3', name: 'Manager', permissions: ['read', 'write'] },
          { id: 'role-4', name: 'Employee', permissions: ['read'] },
        ],
      });

      mockDeveloperAccountService.getRoles.mockReturnValue(mockResult);

      await controller.getRoles(mockResponse, companyId);

      expect(mockDeveloperAccountService.getRoles).toHaveBeenCalledWith(5);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should get roles with company ID as zero string', async () => {
      const companyId = '0';
      const mockResult = Promise.resolve({
        data: [],
      });

      mockDeveloperAccountService.getRoles.mockReturnValue(mockResult);

      await controller.getRoles(mockResponse, companyId);

      expect(mockDeveloperAccountService.getRoles).toHaveBeenCalledWith(0);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should handle invalid company ID format', async () => {
      const companyId = 'invalid';
      const mockResult = Promise.resolve({
        data: [],
      });

      mockDeveloperAccountService.getRoles.mockReturnValue(mockResult);

      await controller.getRoles(mockResponse, companyId);

      // parseInt('invalid', 10) returns NaN, which is falsy
      expect(mockDeveloperAccountService.getRoles).toHaveBeenCalledWith(NaN);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });
  });

  describe('loginAs', () => {
    it('should login as user when current user is developer', async () => {
      const params = { targetUserId: 'target-user-123' };

      const mockResult = Promise.resolve({
        success: true,
        token: 'new-session-token-123',
        user: {
          id: 'target-user-123',
          email: 'target@example.com',
          firstName: 'Target',
          lastName: 'User',
        },
      });

      mockDeveloperAccountService.loginAsUser.mockReturnValue(mockResult);

      await controller.loginAs(mockResponse, params);

      expect(mockDeveloperAccountService.loginAsUser).toHaveBeenCalledWith(
        params.targetUserId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockResult,
        mockResponse,
      );
    });

    it('should throw error when current user is not developer', async () => {
      // Mock non-developer user
      mockUtilityService.accountInformation = {
        isDeveloper: false,
        id: 'regular-user-id',
      };

      const params = { targetUserId: 'target-user-456' };

      await expect(controller.loginAs(mockResponse, params)).rejects.toThrow(
        'Only developer accounts can use this feature',
      );

      expect(mockDeveloperAccountService.loginAsUser).not.toHaveBeenCalled();
      expect(mockUtilityService.responseHandler).not.toHaveBeenCalled();
    });

    it('should throw error when accountInformation is null', async () => {
      // Mock null account information
      mockUtilityService.accountInformation = null;

      const params = { targetUserId: 'target-user-789' };

      await expect(controller.loginAs(mockResponse, params)).rejects.toThrow(
        'Only developer accounts can use this feature',
      );

      expect(mockDeveloperAccountService.loginAsUser).not.toHaveBeenCalled();
      expect(mockUtilityService.responseHandler).not.toHaveBeenCalled();
    });

    it('should throw error when accountInformation is undefined', async () => {
      // Mock undefined account information
      mockUtilityService.accountInformation = undefined;

      const params = { targetUserId: 'target-user-000' };

      await expect(controller.loginAs(mockResponse, params)).rejects.toThrow(
        'Only developer accounts can use this feature',
      );

      expect(mockDeveloperAccountService.loginAsUser).not.toHaveBeenCalled();
      expect(mockUtilityService.responseHandler).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle service errors in get', async () => {
      const params: DeveloperAccountGetDTO = { id: 'error-uuid-123' };
      const mockError = Promise.reject(new Error('Account not found'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.getDeveloperAccount.mockReturnValue(
        mockError,
      );

      await controller.get(mockResponse, params);

      expect(
        mockDeveloperAccountService.getDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in table', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = { filters: [], settings: {} };
      const mockError = Promise.reject(new Error('Database connection failed'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.developerAccountTable.mockReturnValue(
        mockError,
      );

      await controller.table(mockResponse, query, body);

      expect(
        mockDeveloperAccountService.developerAccountTable,
      ).toHaveBeenCalledWith(query, body);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in add', async () => {
      const params: DeveloperAccountCreateDTO = {
        email: 'error@example.com',
        firstName: 'Error',
        lastName: 'Test',
        contactNumber: '+1111111111',
        username: 'errortest',
        password: 'password123',
        roleId: 'error-role-uuid',
      };
      const mockError = Promise.reject(new Error('Email already exists'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.createDeveloperAccount.mockReturnValue(
        mockError,
      );

      await controller.add(mockResponse, params);

      expect(
        mockDeveloperAccountService.createDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in update', async () => {
      const params: DeveloperAccountUpdateDTO = {
        id: 'error-update-uuid-123',
        email: 'error.update@example.com',
      };
      const mockError = Promise.reject(new Error('Update failed'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.updateDeveloperAccount.mockReturnValue(
        mockError,
      );

      await controller.update(mockResponse, params);

      expect(
        mockDeveloperAccountService.updateDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in delete', async () => {
      const params: DeveloperAccountDeleteDTO = { id: 'error-delete-uuid-123' };
      const mockError = Promise.reject(
        new Error('Cannot delete account with active sessions'),
      );
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.deleteDeveloperAccount.mockReturnValue(
        mockError,
      );

      await controller.delete(mockResponse, params);

      expect(
        mockDeveloperAccountService.deleteDeveloperAccount,
      ).toHaveBeenCalledWith(params);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in toggleDeveloper', async () => {
      const params = { accountId: 'error-toggle-uuid-123' };
      const mockError = Promise.reject(new Error('Toggle operation failed'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.toggleDeveloperStatus.mockReturnValue(
        mockError,
      );

      await controller.toggleDeveloper(mockResponse, params);

      expect(
        mockDeveloperAccountService.toggleDeveloperStatus,
      ).toHaveBeenCalledWith(params.accountId);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in getCompanies', async () => {
      const mockError = Promise.reject(new Error('Failed to fetch companies'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.getCompanies.mockReturnValue(mockError);

      await controller.getCompanies(mockResponse);

      expect(mockDeveloperAccountService.getCompanies).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in getRoles', async () => {
      const companyId = '1';
      const mockError = Promise.reject(new Error('Failed to fetch roles'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.getRoles.mockReturnValue(mockError);

      await controller.getRoles(mockResponse, companyId);

      expect(mockDeveloperAccountService.getRoles).toHaveBeenCalledWith(1);
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });

    it('should handle service errors in loginAs', async () => {
      const params = { targetUserId: 'error-target-user-123' };
      const mockError = Promise.reject(new Error('Target user not found'));
      mockError.catch(() => {}); // Prevent unhandled promise rejection

      mockDeveloperAccountService.loginAsUser.mockReturnValue(mockError);

      await controller.loginAs(mockResponse, params);

      expect(mockDeveloperAccountService.loginAsUser).toHaveBeenCalledWith(
        params.targetUserId,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });
});
