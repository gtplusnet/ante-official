import { Test, TestingModule } from '@nestjs/testing';
import { PayrollApproversController } from './payroll-approvers.controller';
import { PayrollApproversService } from './payroll-approvers.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { Response } from 'express';

describe('PayrollApproversController', () => {
  let controller: PayrollApproversController;
  let payrollApproversService: PayrollApproversService;
  let utilityService: UtilityService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollApproversController],
      providers: [
        {
          provide: PayrollApproversService,
          useValue: {
            table: jest.fn(),
            add: jest.fn(),
            bulkAdd: jest.fn(),
            delete: jest.fn(),
            getEmployeeSelect: jest.fn(),
            toggleStatus: jest.fn(),
          },
        },
        {
          provide: UtilityService,
          useValue: {
            responseHandler: jest.fn(),
            companyId: 1,
          },
        },
        {
          provide: TableHandlerService,
          useValue: {
            handle: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PayrollApproversController>(
      PayrollApproversController,
    );
    payrollApproversService = module.get<PayrollApproversService>(
      PayrollApproversService,
    );
    utilityService = module.get<UtilityService>(UtilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('table', () => {
    it('should call table method and return response', async () => {
      const mockTableDto = {
        page: 1,
        perPage: 10,
        searchKeyword: '',
        filters: [],
      };

      const mockTableResult = {
        list: [],
        currentPage: 1,
        pagination: { totalPages: 0 },
        totalCount: 0,
      };

      jest
        .spyOn(payrollApproversService, 'table')
        .mockResolvedValue(mockTableResult as any);

      await controller.table(mockTableDto, mockResponse);

      expect(payrollApproversService.table).toHaveBeenCalledWith(
        mockTableDto,
        1,
      );
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });
  });

  describe('add', () => {
    it('should add a new payroll approver', async () => {
      const mockAddDto = {
        accountId: 'test-account-id',
        approvalLevel: 1,
      };

      const mockAddResult = {
        id: 1,
        account: { id: 'test-account-id', fullName: 'Test User' },
        companyId: 1,
        approvalLevel: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(payrollApproversService, 'add')
        .mockResolvedValue(mockAddResult as any);

      await controller.add(mockAddDto, mockResponse);

      expect(payrollApproversService.add).toHaveBeenCalledWith(mockAddDto, 1);
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });

    it('should handle adding approvers at different levels', async () => {
      const testCases = [
        { accountId: 'user1', approvalLevel: 1 },
        { accountId: 'user2', approvalLevel: 2 },
        { accountId: 'user3', approvalLevel: 3 },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockAddDto = {
          accountId: testCase.accountId,
          approvalLevel: testCase.approvalLevel,
        };

        const mockAddResult = {
          id: testCase.approvalLevel,
          account: {
            id: testCase.accountId,
            fullName: `User ${testCase.approvalLevel}`,
          },
          companyId: 1,
          approvalLevel: testCase.approvalLevel,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        jest
          .spyOn(payrollApproversService, 'add')
          .mockResolvedValue(mockAddResult as any);

        await controller.add(mockAddDto, mockResponse);

        expect(payrollApproversService.add).toHaveBeenCalledWith(mockAddDto, 1);
        expect(mockAddDto.approvalLevel).toBe(testCase.approvalLevel);
      }
    });
  });

  describe('bulkAdd', () => {
    it('should add multiple payroll approvers', async () => {
      const mockBulkAddDto = {
        accountIds: ['acc1', 'acc2'],
        approvalLevel: 2,
      };

      const mockBulkAddResult = [
        {
          id: 1,
          account: { id: 'acc1', fullName: 'User 1' },
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          account: { id: 'acc2', fullName: 'User 2' },
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(payrollApproversService, 'bulkAdd')
        .mockResolvedValue(mockBulkAddResult as any);

      await controller.bulkAdd(mockBulkAddDto, mockResponse);

      expect(payrollApproversService.bulkAdd).toHaveBeenCalledWith(
        mockBulkAddDto,
        1,
      );
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });
  });

  describe('delete', () => {
    it('should delete a payroll approver', async () => {
      const mockDeleteBody = { accountId: 'test-account-id' };
      const mockDeleteResult = { deleted: true };

      jest
        .spyOn(payrollApproversService, 'delete')
        .mockResolvedValue(mockDeleteResult);

      await controller.delete(mockDeleteBody, mockResponse);

      expect(payrollApproversService.delete).toHaveBeenCalledWith(
        'test-account-id',
        1,
      );
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });
  });

  describe('getEmployeeSelect', () => {
    it('should get employees available for selection', async () => {
      const mockEmployees = [
        {
          id: 1,
          accountId: 'acc1',
          employeeCode: 'EMP001',
          fullName: 'Employee 1',
        },
        {
          id: 2,
          accountId: 'acc2',
          employeeCode: 'EMP002',
          fullName: 'Employee 2',
        },
      ];

      jest
        .spyOn(payrollApproversService, 'getEmployeeSelect')
        .mockResolvedValue(mockEmployees as any);

      await controller.getEmployeeSelect({}, mockResponse);

      expect(payrollApproversService.getEmployeeSelect).toHaveBeenCalledWith(
        {},
      );
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });
  });

  describe('toggleStatus', () => {
    it('should toggle approver status', async () => {
      const mockToggleBody = { accountId: 'test-account-id' };
      const mockToggleResult = {
        id: 1,
        account: { id: 'test-account-id', fullName: 'Test User' },
        companyId: 1,
        approvalLevel: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(payrollApproversService, 'toggleStatus')
        .mockResolvedValue(mockToggleResult as any);

      await controller.toggleStatus(mockToggleBody, mockResponse);

      expect(payrollApproversService.toggleStatus).toHaveBeenCalledWith(
        'test-account-id',
        1,
      );
      expect(utilityService.responseHandler).toHaveBeenCalledWith(
        expect.any(Promise),
        mockResponse,
      );
    });
  });
});
