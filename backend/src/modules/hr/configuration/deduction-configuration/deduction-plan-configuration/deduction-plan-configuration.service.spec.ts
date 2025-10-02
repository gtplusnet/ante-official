import { Test, TestingModule } from '@nestjs/testing';
import { DeductionPlanConfigurationService } from './deduction-plan-configuration.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { AccountService } from '@modules/account/account/account.service';
import { DeductionConfigurationService } from '../deduction-configuration.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { DeductionPeriod } from '@prisma/client';
import { CreateDeductionPlanConfigurationRequest } from '@shared/request';

describe('DeductionPlanConfigurationService', () => {
  let service: DeductionPlanConfigurationService;
  // let prismaService: PrismaService;

  const mockPrismaService = {
    deductionPlan: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    deductionPlanHistory: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    deductionConfiguration: {
      findUnique: jest.fn(),
    },
    employeeData: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        accountId: 'test-account-id',
      }),
    },
  };

  const mockUtilityService = {
    companyId: 1,
    accountInformation: {
      companyId: 1,
    },
    formatCurrency: jest.fn((amount) => amount),
    formatDate: jest.fn((date) => date),
  };

  const mockNotificationService = {};

  const mockTableHandlerService = {
    initialize: jest.fn(),
    constructTableQuery: jest.fn(),
    getTableData: jest.fn(),
  };

  const mockAccountService = {
    formatData: jest.fn(),
    getAccountInformation: jest.fn().mockResolvedValue({
      id: 'test-account-id',
      name: 'Test Account',
    }),
  };

  const mockDeductionConfigurationService = {
    formatResponse: jest.fn(),
    getById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Deduction Configuration',
      category: {
        hasTotalAmount: true,
      },
    }),
  };

  const mockEmployeeListService = {
    formatResponse: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Employee',
    }),
  };

  const mockEmployeeSelectionService = {
    getSelectableEmployees: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeductionPlanConfigurationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
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
          provide: DeductionConfigurationService,
          useValue: mockDeductionConfigurationService,
        },
        {
          provide: EmployeeListService,
          useValue: mockEmployeeListService,
        },
        {
          provide: EmployeeSelectionService,
          useValue: mockEmployeeSelectionService,
        },
      ],
    }).compile();

    service = module.get<DeductionPlanConfigurationService>(
      DeductionPlanConfigurationService,
    );
    // prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mock implementations
    jest.clearAllMocks();

    // Reset default implementations
    mockPrismaService.deductionPlan.findFirst.mockResolvedValue(null);
    mockPrismaService.deductionPlan.findUnique.mockResolvedValue(null);
    mockPrismaService.deductionPlan.create.mockResolvedValue({});
    mockPrismaService.deductionPlan.update.mockResolvedValue({});
    mockPrismaService.deductionPlanHistory.findMany.mockResolvedValue([]);
    mockPrismaService.deductionPlanHistory.findFirst.mockResolvedValue(null);
    mockPrismaService.deductionPlanHistory.create.mockResolvedValue({});
    mockPrismaService.deductionConfiguration.findUnique.mockResolvedValue({
      id: 1,
      category: { hasTotalAmount: true },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.skip('create', () => {
    it('should create deduction plan with FIRST_PERIOD', async () => {
      const request: CreateDeductionPlanConfigurationRequest = {
        employeeAccountId: 'test-employee-id',
        loanAmount: 10000,
        monthlyAmortization: 1000,
        deductionConfigurationId: 1,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        effectivityDate: '2025-01-01',
      };

      const expectedDeductionPlan = {
        id: 1,
        name: request.employeeAccountId,
        monthlyAmortization: request.monthlyAmortization,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        effectivityDate: new Date(request.effectivityDate),
        totalAmount: request.loanAmount,
        remainingBalance: request.loanAmount,
        isActive: true,
        accountId: request.employeeAccountId,
        deductionConfigurationId: request.deductionConfigurationId,
      };

      // Mock the response for formatResponse would be defined here if needed

      // Reset mocks for this test
      mockPrismaService.deductionPlan.findUnique
        .mockResolvedValueOnce(null) // For existence check
        .mockResolvedValueOnce(expectedDeductionPlan); // For getting updated data after create
      mockPrismaService.deductionPlan.create.mockResolvedValueOnce(
        expectedDeductionPlan,
      );
      mockPrismaService.deductionPlanHistory.findMany.mockResolvedValueOnce([]);
      mockPrismaService.employeeData.findUnique.mockResolvedValueOnce({
        id: 1,
        accountId: request.employeeAccountId,
        employeeCode: 'EMP001',
      });
      mockEmployeeListService.formatResponse.mockResolvedValueOnce({
        id: 1,
        name: 'Test Employee',
        employeeCode: 'EMP001',
      });
      mockUtilityService.formatCurrency.mockImplementation((amount) => ({
        amount,
        formatCurrency: amount.toLocaleString(),
      }));

      await service.create(request);

      expect(mockPrismaService.deductionPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        }),
      });
    });

    it('should create deduction plan with LAST_PERIOD', async () => {
      const request: CreateDeductionPlanConfigurationRequest = {
        employeeAccountId: 'test-employee-id',
        loanAmount: 10000,
        monthlyAmortization: 1000,
        deductionConfigurationId: 1,
        deductionPeriod: DeductionPeriod.LAST_PERIOD,
        effectivityDate: '2025-01-01',
      };

      const expectedDeductionPlan = {
        id: 2,
        name: request.employeeAccountId,
        monthlyAmortization: request.monthlyAmortization,
        deductionPeriod: DeductionPeriod.LAST_PERIOD,
        effectivityDate: new Date(request.effectivityDate),
        totalAmount: request.loanAmount,
        remainingBalance: request.loanAmount,
        isActive: true,
        accountId: request.employeeAccountId,
        deductionConfigurationId: request.deductionConfigurationId,
      };

      // Reset mocks for this test
      mockPrismaService.deductionPlan.findUnique
        .mockResolvedValueOnce(null) // For existence check (findUnique with deductionConfigurationId_accountId)
        .mockResolvedValueOnce(expectedDeductionPlan); // For final response (findUnique with id)
      mockPrismaService.deductionPlan.create.mockResolvedValueOnce(
        expectedDeductionPlan,
      );
      mockPrismaService.deductionPlanHistory.findMany.mockResolvedValueOnce([]); // For updateBalance

      await service.create(request);

      expect(mockPrismaService.deductionPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deductionPeriod: DeductionPeriod.LAST_PERIOD,
        }),
      });
    });

    it('should create deduction plan with EVERY_PERIOD', async () => {
      const request: CreateDeductionPlanConfigurationRequest = {
        employeeAccountId: 'test-employee-id',
        loanAmount: 10000,
        monthlyAmortization: 1000,
        deductionConfigurationId: 1,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        effectivityDate: '2025-01-01',
      };

      const expectedDeductionPlan = {
        id: 3,
        name: request.employeeAccountId,
        monthlyAmortization: request.monthlyAmortization,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        effectivityDate: new Date(request.effectivityDate),
        totalAmount: request.loanAmount,
        remainingBalance: request.loanAmount,
        isActive: true,
      };

      // Reset mocks for this test
      mockPrismaService.deductionPlan.findUnique
        .mockResolvedValueOnce(null) // For existence check (findUnique with deductionConfigurationId_accountId)
        .mockResolvedValueOnce(expectedDeductionPlan); // For final response (findUnique with id)
      mockPrismaService.deductionPlan.create.mockResolvedValueOnce(
        expectedDeductionPlan,
      );
      mockPrismaService.deductionPlanHistory.findMany.mockResolvedValueOnce([]); // For updateBalance

      await service.create(request);

      expect(mockPrismaService.deductionPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        }),
      });
    });
  });

  describe('update', () => {
    it('should update deduction plan with new deduction period', async () => {
      const updateRequest = {
        id: 1,
        employeeAccountId: 'test-employee-id',
        loanAmount: 10000,
        monthlyAmortization: 1000,
        deductionConfigurationId: 1,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        effectivityDate: '2025-01-01',
      };

      const expectedDeductionPlan = {
        id: 1,
        name: updateRequest.employeeAccountId,
        monthlyAmortization: updateRequest.monthlyAmortization,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        effectivityDate: new Date(updateRequest.effectivityDate),
        totalAmount: updateRequest.loanAmount,
        remainingBalance: 5000,
        isActive: true,
      };

      // Reset mocks for this test
      mockPrismaService.deductionPlan.findFirst.mockResolvedValueOnce(null); // For existence check
      mockPrismaService.deductionPlan.findUnique
        .mockResolvedValueOnce({ id: 1 }) // For update check
        .mockResolvedValueOnce(expectedDeductionPlan); // For final response
      mockPrismaService.deductionPlan.update.mockResolvedValueOnce(
        expectedDeductionPlan,
      );
      mockPrismaService.deductionPlanHistory.findMany.mockResolvedValueOnce([]); // For updateBalance
      mockPrismaService.deductionConfiguration.findUnique.mockResolvedValueOnce(
        {
          id: 1,
          category: { hasTotalAmount: true },
        },
      );

      await service.update(updateRequest);

      expect(mockPrismaService.deductionPlan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        }),
      });
    });
  });

  describe('getEmployeeSelect', () => {
    it('should return employees not already in deduction plans', async () => {
      const deductionConfigurationId = 1;
      const mockDeductionPlans = [{ accountId: 'acc1' }, { accountId: 'acc2' }];

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

      mockPrismaService.deductionConfiguration.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.deductionPlan.findMany = jest
        .fn()
        .mockResolvedValue(mockDeductionPlans);
      mockEmployeeSelectionService.getSelectableEmployees.mockResolvedValue(
        mockEmployees,
      );

      const result = await service.getEmployeeSelect(deductionConfigurationId);

      expect(mockPrismaService.deductionPlan.findMany).toHaveBeenCalledWith({
        where: {
          deductionConfigurationId,
        },
        select: {
          accountId: true,
        },
      });
      expect(
        mockEmployeeSelectionService.getSelectableEmployees,
      ).toHaveBeenCalledWith({ excludeAccountIds: ['acc1', 'acc2'] }, 1);
      expect(result).toEqual(mockEmployees);
    });

    it('should pass filter parameters to employee selection service', async () => {
      const deductionConfigurationId = 1;
      const filters = {
        branch: '1',
        role: 'role1',
        employmentStatus: 'REGULAR',
        search: 'test',
      };
      const mockDeductionPlans = [{ accountId: 'acc1' }];
      const mockEmployees = [];

      mockPrismaService.deductionConfiguration.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.deductionPlan.findMany = jest
        .fn()
        .mockResolvedValue(mockDeductionPlans);
      mockEmployeeSelectionService.getSelectableEmployees.mockResolvedValue(
        mockEmployees,
      );

      await service.getEmployeeSelect(deductionConfigurationId, filters);

      expect(
        mockEmployeeSelectionService.getSelectableEmployees,
      ).toHaveBeenCalledWith({ ...filters, excludeAccountIds: ['acc1'] }, 1);
    });
  });
});
