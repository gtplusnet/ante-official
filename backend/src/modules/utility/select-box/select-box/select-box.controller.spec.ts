import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { SelectBoxController } from './select-box.controller';
import { SelectBoxService } from './select-box.service';
import { UtilityService } from '@common/utility.service';

describe('SelectBoxController', () => {
  let controller: SelectBoxController;
  let selectBoxService: SelectBoxService;
  let utilityService: UtilityService;
  let mockResponse: Partial<Response>;

  const mockSelectBoxService = {
    getAccountList: jest.fn(),
    getUserList: jest.fn(),
    getSelectEmployeeList: jest.fn(),
    getClientList: jest.fn(),
    getSupplierList: jest.fn(),
    getProjectList: jest.fn(),
    getRoleList: jest.fn(),
    getBranchList: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn(),
    errorResponse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelectBoxController],
      providers: [
        {
          provide: SelectBoxService,
          useValue: mockSelectBoxService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<SelectBoxController>(SelectBoxController);
    selectBoxService = module.get<SelectBoxService>(SelectBoxService);
    utilityService = module.get<UtilityService>(UtilityService);
  });

  describe('getAccountList', () => {
    const mockAccountListData = [
      {
        key: 'account-1',
        label: 'John Michael Doe (Manager)',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        username: 'johndoe',
        email: 'john.doe@example.com',
        roleId: 'role-1',
        roleName: 'Manager',
        departmentId: null,
        departmentName: '',
      },
      {
        key: 'account-2',
        label: 'Jane Smith (Developer)',
        firstName: 'Jane',
        lastName: 'Smith',
        middleName: null,
        username: 'janesmith',
        email: 'jane.smith@example.com',
        roleId: 'role-2',
        roleName: 'Developer',
        departmentId: null,
        departmentName: '',
      },
      {
        key: 'account-3',
        label: 'Bob Johnson',
        firstName: 'Bob',
        lastName: 'Johnson',
        middleName: 'Lee',
        username: 'bobjohnson',
        email: 'bob.johnson@example.com',
        roleId: null,
        roleName: '',
        departmentId: null,
        departmentName: '',
      },
    ];

    describe('successful responses', () => {
      it('should return account list with proper response format', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledWith({
          search: undefined,
          role: undefined,
          department: undefined,
        });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: mockAccountListData,
        });
      });

      it('should handle empty account list', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue([]);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledWith({
          search: undefined,
          role: undefined,
          department: undefined,
        });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: [],
        });
      });

      it('should return single account in list format', async () => {
        const singleAccount = [mockAccountListData[0]];
        mockSelectBoxService.getAccountList.mockResolvedValue(singleAccount);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: singleAccount,
        });
      });

      it('should handle large account lists', async () => {
        const largeAccountList = Array.from({ length: 100 }, (_, i) => ({
          key: `account-${i}`,
          label: `User ${i} (Role ${i})`,
          firstName: `User${i}`,
          lastName: `LastName${i}`,
          middleName: null,
          username: `user${i}`,
          email: `user${i}@example.com`,
          roleId: `role-${i}`,
          roleName: `Role ${i}`,
        }));
        mockSelectBoxService.getAccountList.mockResolvedValue(largeAccountList);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: largeAccountList,
        });
      });
    });

    describe('error handling', () => {
      it('should handle service errors and return error response', async () => {
        const serviceError = new Error('Database connection failed');
        mockSelectBoxService.getAccountList.mockRejectedValue(serviceError);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          serviceError,
          'Account list fetched failed',
        );
        expect(mockResponse.status).not.toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should handle timeout errors appropriately', async () => {
        const timeoutError = new Error('Request timeout');
        mockSelectBoxService.getAccountList.mockRejectedValue(timeoutError);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          timeoutError,
          'Account list fetched failed',
        );
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Invalid company ID');
        mockSelectBoxService.getAccountList.mockRejectedValue(validationError);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          validationError,
          'Account list fetched failed',
        );
      });

      it('should handle service method throwing synchronous errors', async () => {
        const syncError = new Error('Synchronous error');
        mockSelectBoxService.getAccountList.mockImplementation(() => {
          throw syncError;
        });

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          syncError,
          'Account list fetched failed',
        );
      });

      it('should handle unexpected error types', async () => {
        const unexpectedError = 'String error instead of Error object';
        mockSelectBoxService.getAccountList.mockRejectedValue(unexpectedError);

        await controller.getAccountList(mockResponse as Response);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(1);
        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          unexpectedError,
          'Account list fetched failed',
        );
      });

      it('should provide consistent error message for all error types', async () => {
        const errors = [
          new Error('Database error'),
          new Error('Network error'),
          new Error('Authorization error'),
          'String error',
          null,
          undefined,
        ];

        for (const error of errors) {
          mockSelectBoxService.getAccountList.mockRejectedValue(error);

          await controller.getAccountList(mockResponse as Response);

          expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
            mockResponse,
            error,
            'Account list fetched failed',
          );

          jest.clearAllMocks();
        }
      });
    });

    describe('response structure validation', () => {
      it('should always return list property in response', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
        expect(responseCall).toHaveProperty('list');
        expect(Array.isArray(responseCall.list)).toBe(true);
      });

      it('should preserve exact data structure from service', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
        expect(responseCall.list).toEqual(mockAccountListData);
      });

      it('should handle null response from service', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(null);

        await controller.getAccountList(mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: null,
        });
      });

      it('should handle undefined response from service', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(undefined);

        await controller.getAccountList(mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: undefined,
        });
      });
    });

    describe('integration with utility service', () => {
      it('should not call responseHandler method since using direct response', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        expect(mockUtilityService.responseHandler).not.toHaveBeenCalled();
      });

      it('should call errorResponse with correct parameters', async () => {
        const error = new Error('Test error');
        mockSelectBoxService.getAccountList.mockRejectedValue(error);

        await controller.getAccountList(mockResponse as Response);

        expect(mockUtilityService.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          error,
          'Account list fetched failed',
        );
      });
    });

    describe('HTTP status codes', () => {
      it('should return 200 OK for successful requests', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      });

      it('should not set status for error cases (handled by errorResponse)', async () => {
        const error = new Error('Test error');
        mockSelectBoxService.getAccountList.mockRejectedValue(error);

        await controller.getAccountList(mockResponse as Response);

        expect(mockResponse.status).not.toHaveBeenCalledWith(HttpStatus.OK);
      });
    });

    describe('method parameters', () => {
      it('should call service with filters when provided', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(
          mockResponse as Response,
          'john',
          'Manager',
          'Engineering',
        );

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledWith({
          search: 'john',
          role: 'Manager',
          department: 'Engineering',
        });
      });

      it('should accept response and filter parameters', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        // Verify method signature accepts response and 3 optional filter parameters
        const methodLength = controller.getAccountList.length;
        expect(methodLength).toBe(4); // response, search, role, department
      });
    });

    describe('concurrency and performance', () => {
      it('should handle concurrent requests properly', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        const promises = Array.from({ length: 5 }, () =>
          controller.getAccountList(mockResponse as Response),
        );

        await Promise.all(promises);

        expect(mockSelectBoxService.getAccountList).toHaveBeenCalledTimes(5);
        expect(mockResponse.status).toHaveBeenCalledTimes(5);
        expect(mockResponse.json).toHaveBeenCalledTimes(5);
      });

      it('should handle service call completion timing', async () => {
        const delayedResponse = new Promise((resolve) =>
          setTimeout(() => resolve(mockAccountListData), 100),
        );
        mockSelectBoxService.getAccountList.mockReturnValue(delayedResponse);

        const startTime = Date.now();
        await controller.getAccountList(mockResponse as Response);
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      });
    });

    describe('edge cases', () => {
      it('should handle response object being modified during execution', async () => {
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        // Simulate response being modified
        const originalJson = mockResponse.json;
        let callCount = 0;
        mockResponse.json = jest.fn().mockImplementation((...args) => {
          callCount++;
          return originalJson?.call(mockResponse, ...args);
        });

        await controller.getAccountList(mockResponse as Response);

        expect(callCount).toBe(1);
        expect(mockResponse.json).toHaveBeenCalledWith({
          list: mockAccountListData,
        });
      });

      it('should maintain data integrity through the call chain', async () => {
        const originalData = JSON.parse(JSON.stringify(mockAccountListData));
        mockSelectBoxService.getAccountList.mockResolvedValue(
          mockAccountListData,
        );

        await controller.getAccountList(mockResponse as Response);

        // Verify data wasn't mutated
        expect(mockAccountListData).toEqual(originalData);
      });
    });
  });

  describe('controller dependencies', () => {
    it('should have selectBoxService injected', () => {
      expect(controller.selectBoxService).toBeDefined();
      expect(controller.selectBoxService).toBe(selectBoxService);
    });

    it('should have utilityService injected', () => {
      expect(controller.utilityService).toBeDefined();
      expect(controller.utilityService).toBe(utilityService);
    });
  });

  describe('controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should be instance of SelectBoxController', () => {
      expect(controller).toBeInstanceOf(SelectBoxController);
    });
  });
});
