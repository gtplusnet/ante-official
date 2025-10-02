import { Test, TestingModule } from '@nestjs/testing';
import { PayrollApproversService } from './payroll-approvers.service';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { AccountService } from '@modules/account/account/account.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { UtilityService } from '@common/utility.service';

describe('PayrollApproversService', () => {
  let service: PayrollApproversService;

  const mockPrismaService = {
    payrollApprovers: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    employeeData: {
      findMany: jest.fn(),
    },
  };

  const mockTableHandlerService = {
    initialize: jest.fn(),
    constructTableQuery: jest.fn(),
    getTableData: jest.fn(),
  };

  const mockAccountService = {
    formatData: jest.fn(),
  };

  const mockEmployeeListService = {
    formatResponse: jest.fn(),
  };

  const mockEmployeeSelectionService = {
    getSelectableEmployees: jest.fn(),
  };

  const mockUtilityService = {
    companyId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollApproversService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TableHandlerService,
          useValue: mockTableHandlerService,
        },
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
        {
          provide: EmployeeListService,
          useValue: mockEmployeeListService,
        },
        {
          provide: EmployeeSelectionService,
          useValue: mockEmployeeSelectionService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    service = module.get<PayrollApproversService>(PayrollApproversService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('table', () => {
    it('should return paginated list of approvers', async () => {
      const mockTableRequest = {
        page: 1,
        perPage: 10,
        searchKeyword: '',
        filters: [],
      };

      const mockApprovers = [
        {
          id: 1,
          accountId: 'acc1',
          companyId: 1,
          approvalLevel: 1,
          isActive: true,
          account: { id: 'acc1', fullName: 'John Doe' },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          accountId: 'acc2',
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
          account: { id: 'acc2', fullName: 'Jane Smith' },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockTableHandlerService.constructTableQuery.mockReturnValue({
        where: {},
      });
      mockTableHandlerService.getTableData.mockResolvedValue({
        list: mockApprovers,
        currentPage: 1,
        pagination: { totalPages: 1 },
      });
      mockAccountService.formatData.mockImplementation((account) => ({
        id: account.id,
        fullName: account.fullName,
      }));

      const result = await service.table(mockTableRequest, 1);

      expect(mockTableHandlerService.initialize).toHaveBeenCalled();
      expect(mockTableHandlerService.getTableData).toHaveBeenCalledWith(
        mockPrismaService.payrollApprovers,
        expect.any(Object),
        expect.objectContaining({
          where: { companyId: 1 },
          include: { account: true },
        }),
      );
      expect(result.list).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      const mockTableRequest = {
        page: 1,
        perPage: 10,
        searchKeyword: '',
        filters: [],
      };

      mockTableHandlerService.constructTableQuery.mockReturnValue({
        where: {},
      });
      mockTableHandlerService.getTableData.mockResolvedValue({
        list: [],
        currentPage: 1,
        pagination: { totalPages: 0 },
      });

      const result = await service.table(mockTableRequest, 1);

      expect(result.list).toHaveLength(0);
    });
  });

  describe('add', () => {
    it('should create new approver with default level 1', async () => {
      const mockAddRequest = {
        accountId: 'test-account-id',
      };

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);
      mockPrismaService.payrollApprovers.create.mockResolvedValue({
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 1,
        isActive: true,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.add(mockAddRequest, 1);

      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledWith({
        data: {
          accountId: 'test-account-id',
          companyId: 1,
          approvalLevel: 1,
          isActive: true,
        },
        include: { account: true },
      });
      expect(result.approvalLevel).toBe(1);
      expect(result.isActive).toBe(true);
    });

    it('should create approver with specified level (number)', async () => {
      const mockAddRequest = {
        accountId: 'test-account-id',
        approvalLevel: 2,
      };

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);
      mockPrismaService.payrollApprovers.create.mockResolvedValue({
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 2,
        isActive: true,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.add(mockAddRequest, 1);

      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledWith({
        data: {
          accountId: 'test-account-id',
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
        },
        include: { account: true },
      });
      expect(result.approvalLevel).toBe(2);
    });

    it('should create approver with level object', async () => {
      const mockAddRequest = {
        accountId: 'test-account-id',
        approvalLevel: { value: 3, label: 'Level 3' },
      } as any;

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);
      mockPrismaService.payrollApprovers.create.mockResolvedValue({
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 3,
        isActive: true,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.add(mockAddRequest, 1);

      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledWith({
        data: {
          accountId: 'test-account-id',
          companyId: 1,
          approvalLevel: 3,
          isActive: true,
        },
        include: { account: true },
      });
      expect(result.approvalLevel).toBe(3);
    });

    it('should throw error if approver already exists at same level', async () => {
      const mockAddRequest = {
        accountId: 'test-account-id',
        approvalLevel: 1,
      };

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue({
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 1,
      });

      await expect(service.add(mockAddRequest, 1)).rejects.toThrow(
        'This account is already an approver at level 1 for this company.',
      );
    });

    it('should allow same account to be approver at different levels', async () => {
      const mockAddRequest = {
        accountId: 'test-account-id',
        approvalLevel: 2,
      };

      // The service will check if the user exists at level 2 (not level 1)
      // So we should return null to allow creation
      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);

      mockPrismaService.payrollApprovers.create.mockResolvedValue({
        id: 2,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 2,
        isActive: true,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.add(mockAddRequest, 1);

      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledWith({
        data: {
          accountId: 'test-account-id',
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
        },
        include: { account: true },
      });
      expect(result.approvalLevel).toBe(2);
    });

    it('should handle all three approval levels correctly', async () => {
      const testCases = [
        { level: 1, accountId: 'user1' },
        { level: 2, accountId: 'user2' },
        { level: 3, accountId: 'user3' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockAddRequest = {
          accountId: testCase.accountId,
          approvalLevel: testCase.level,
        };

        mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);
        mockPrismaService.payrollApprovers.create.mockResolvedValue({
          id: testCase.level,
          accountId: testCase.accountId,
          companyId: 1,
          approvalLevel: testCase.level,
          isActive: true,
          account: {
            id: testCase.accountId,
            fullName: `User ${testCase.level}`,
          },
        });
        mockAccountService.formatData.mockResolvedValue({
          id: testCase.accountId,
          fullName: `User ${testCase.level}`,
        });

        const result = await service.add(mockAddRequest, 1);

        expect(result.approvalLevel).toBe(testCase.level);
        expect(result.account.id).toBe(testCase.accountId);
      }
    });
  });

  describe('bulkAdd', () => {
    it('should add multiple approvers', async () => {
      const mockBulkAddRequest = {
        accountIds: ['acc1', 'acc2', 'acc3'],
        approvalLevel: 1,
      };

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue([]);
      mockPrismaService.payrollApprovers.create
        .mockResolvedValueOnce({
          id: 1,
          accountId: 'acc1',
          companyId: 1,
          approvalLevel: 1,
          account: { id: 'acc1', fullName: 'User 1' },
        })
        .mockResolvedValueOnce({
          id: 2,
          accountId: 'acc2',
          companyId: 1,
          approvalLevel: 1,
          account: { id: 'acc2', fullName: 'User 2' },
        })
        .mockResolvedValueOnce({
          id: 3,
          accountId: 'acc3',
          companyId: 1,
          approvalLevel: 1,
          account: { id: 'acc3', fullName: 'User 3' },
        });
      mockAccountService.formatData.mockImplementation((account) => ({
        id: account.id,
        fullName: account.fullName,
      }));

      const result = await service.bulkAdd(mockBulkAddRequest, 1);

      expect(result).toHaveLength(3);
      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledTimes(
        3,
      );
    });

    it('should skip existing approvers', async () => {
      const mockBulkAddRequest = {
        accountIds: ['acc1', 'acc2', 'acc3'],
        approvalLevel: 1,
      };

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue([
        { accountId: 'acc1', approvalLevel: 1 },
      ]);
      mockPrismaService.payrollApprovers.create
        .mockResolvedValueOnce({
          id: 2,
          accountId: 'acc2',
          companyId: 1,
          approvalLevel: 1,
          account: { id: 'acc2', fullName: 'User 2' },
        })
        .mockResolvedValueOnce({
          id: 3,
          accountId: 'acc3',
          companyId: 1,
          approvalLevel: 1,
          account: { id: 'acc3', fullName: 'User 3' },
        });
      mockAccountService.formatData.mockImplementation((account) => ({
        id: account.id,
        fullName: account.fullName,
      }));

      const result = await service.bulkAdd(mockBulkAddRequest, 1);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.payrollApprovers.create).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should throw error if all accounts already exist', async () => {
      const mockBulkAddRequest = {
        accountIds: ['acc1', 'acc2'],
        approvalLevel: 1,
      };

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue([
        { accountId: 'acc1', approvalLevel: 1 },
        { accountId: 'acc2', approvalLevel: 1 },
      ]);

      await expect(service.bulkAdd(mockBulkAddRequest, 1)).rejects.toThrow(
        'All provided accounts are already approvers at level 1 for this company.',
      );
    });

    it('should add multiple approvers at different levels', async () => {
      const testCases = [
        { accountIds: ['acc1', 'acc2'], level: 1 },
        { accountIds: ['acc3', 'acc4'], level: 2 },
        { accountIds: ['acc5', 'acc6'], level: 3 },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockBulkAddRequest = {
          accountIds: testCase.accountIds,
          approvalLevel: testCase.level,
        };

        mockPrismaService.payrollApprovers.findMany.mockResolvedValue([]);

        testCase.accountIds.forEach((accountId, index) => {
          mockPrismaService.payrollApprovers.create.mockResolvedValueOnce({
            id: index + 1,
            accountId,
            companyId: 1,
            approvalLevel: testCase.level,
            account: { id: accountId, fullName: `User ${accountId}` },
          });
        });

        mockAccountService.formatData.mockImplementation((account) => ({
          id: account.id,
          fullName: account.fullName,
        }));

        const result = await service.bulkAdd(mockBulkAddRequest, 1);

        expect(result).toHaveLength(testCase.accountIds.length);
        result.forEach((approver, index) => {
          expect(approver.approvalLevel).toBe(testCase.level);
          expect(approver.account.id).toBe(testCase.accountIds[index]);
        });
      }
    });
  });

  describe('delete', () => {
    it('should delete approver by accountId and companyId', async () => {
      mockPrismaService.payrollApprovers.deleteMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.delete('test-account-id', 1);

      expect(
        mockPrismaService.payrollApprovers.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          accountId: 'test-account-id',
          companyId: 1,
        },
      });
      expect(result).toEqual({ deleted: true });
    });

    it('should return deleted true even if no records deleted', async () => {
      mockPrismaService.payrollApprovers.deleteMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.delete('non-existent-id', 1);

      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getEmployeeSelect', () => {
    it('should return employees not already approvers', async () => {
      const mockApprovers = [{ accountId: 'acc1' }, { accountId: 'acc2' }];

      const mockEmployees = [
        {
          id: 1,
          accountId: 'acc3',
          employeeCode: 'EMP003',
          accountDetails: { fullName: 'Employee EMP003' },
        },
        {
          id: 2,
          accountId: 'acc4',
          employeeCode: 'EMP004',
          accountDetails: { fullName: 'Employee EMP004' },
        },
      ];

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue(
        mockApprovers,
      );
      mockEmployeeSelectionService.getSelectableEmployees.mockResolvedValue(
        mockEmployees,
      );

      const result = await service.getEmployeeSelect();

      expect(mockPrismaService.payrollApprovers.findMany).toHaveBeenCalledWith({
        where: { companyId: 1 },
        select: { accountId: true },
      });
      expect(
        mockEmployeeSelectionService.getSelectableEmployees,
      ).toHaveBeenCalledWith({ excludeAccountIds: ['acc1', 'acc2'] }, 1);
      expect(result).toEqual(mockEmployees);
    });

    it('should pass filter parameters to employee selection service', async () => {
      const mockApprovers = [{ accountId: 'acc1' }];
      const mockEmployees = [];
      const filters = {
        branch: '1',
        role: 'role1',
        employmentStatus: 'REGULAR',
        search: 'test',
      };

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue(
        mockApprovers,
      );
      mockEmployeeSelectionService.getSelectableEmployees.mockResolvedValue(
        mockEmployees,
      );

      await service.getEmployeeSelect(filters);

      expect(
        mockEmployeeSelectionService.getSelectableEmployees,
      ).toHaveBeenCalledWith({ ...filters, excludeAccountIds: ['acc1'] }, 1);
    });

    it('should throw error if companyId is missing', async () => {
      const serviceWithoutCompanyId = new PayrollApproversService(
        mockPrismaService as any,
        mockTableHandlerService as any,
        mockAccountService as any,
        mockEmployeeListService as any,
        { companyId: null } as any,
        mockEmployeeSelectionService as any,
      );

      await expect(serviceWithoutCompanyId.getEmployeeSelect()).rejects.toThrow(
        'Company ID is required',
      );
    });
  });

  describe('getApproversByLevel', () => {
    it('should return only active approvers at specified level', async () => {
      const mockApprovers = [
        {
          id: 1,
          accountId: 'acc1',
          approvalLevel: 2,
          isActive: true,
          account: { id: 'acc1' },
        },
        {
          id: 2,
          accountId: 'acc2',
          approvalLevel: 2,
          isActive: true,
          account: { id: 'acc2' },
        },
      ];

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue(
        mockApprovers,
      );
      mockAccountService.formatData.mockImplementation((account) => ({
        id: account.id,
        fullName: `User ${account.id}`,
      }));

      const result = await service.getApproversByLevel(2);

      expect(mockPrismaService.payrollApprovers.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 1,
          approvalLevel: 2,
          isActive: true,
        },
        include: { account: true },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no approvers at level', async () => {
      mockPrismaService.payrollApprovers.findMany.mockResolvedValue([]);

      const result = await service.getApproversByLevel(3);

      expect(result).toHaveLength(0);
    });
  });

  describe('getApprovalChain', () => {
    it('should return approval chain grouped by level', async () => {
      const mockApprovers = [
        { accountId: 'acc1', approvalLevel: 1, isActive: true },
        { accountId: 'acc2', approvalLevel: 1, isActive: true },
        { accountId: 'acc3', approvalLevel: 2, isActive: true },
        { accountId: 'acc4', approvalLevel: 3, isActive: true },
      ];

      mockPrismaService.payrollApprovers.findMany.mockResolvedValue(
        mockApprovers,
      );

      const result = await service.getApprovalChain();

      expect(mockPrismaService.payrollApprovers.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 1,
          isActive: true,
        },
        orderBy: {
          approvalLevel: 'asc',
        },
      });
      expect(result).toEqual({
        '1': ['acc1', 'acc2'],
        '2': ['acc3'],
        '3': ['acc4'],
      });
    });

    it('should handle empty approval chain', async () => {
      mockPrismaService.payrollApprovers.findMany.mockResolvedValue([]);

      const result = await service.getApprovalChain();

      expect(result).toEqual({});
    });
  });

  describe('toggleStatus', () => {
    it('should toggle approver status from active to inactive', async () => {
      const mockApprover = {
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 1,
        isActive: true,
      };

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(
        mockApprover,
      );
      mockPrismaService.payrollApprovers.update.mockResolvedValue({
        ...mockApprover,
        isActive: false,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.toggleStatus('test-account-id', 1);

      expect(mockPrismaService.payrollApprovers.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
        include: { account: true },
      });
      expect(result.isActive).toBe(false);
    });

    it('should toggle approver status from inactive to active', async () => {
      const mockApprover = {
        id: 1,
        accountId: 'test-account-id',
        companyId: 1,
        approvalLevel: 1,
        isActive: false,
      };

      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(
        mockApprover,
      );
      mockPrismaService.payrollApprovers.update.mockResolvedValue({
        ...mockApprover,
        isActive: true,
        account: { id: 'test-account-id', fullName: 'Test User' },
      });
      mockAccountService.formatData.mockResolvedValue({
        id: 'test-account-id',
        fullName: 'Test User',
      });

      const result = await service.toggleStatus('test-account-id', 1);

      expect(result.isActive).toBe(true);
    });

    it('should throw error if approver not found', async () => {
      mockPrismaService.payrollApprovers.findFirst.mockResolvedValue(null);

      await expect(service.toggleStatus('non-existent-id', 1)).rejects.toThrow(
        'Approver not found',
      );
    });
  });
});
