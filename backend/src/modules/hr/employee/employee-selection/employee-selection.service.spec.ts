import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeSelectionService } from './employee-selection.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeListService } from '../employee-list/employee-list.service';
import { EmployeeSelectionFilterDto } from './employee-selection.dto';

describe('EmployeeSelectionService', () => {
  let service: EmployeeSelectionService;
  // let prismaService: PrismaService;
  // let utilityService: UtilityService;
  // let employeeListService: EmployeeListService;

  const mockPrismaService = {
    employeeData: {
      findMany: jest.fn(),
    },
  };

  const mockUtilityService = {
    companyId: 1,
  };

  const mockEmployeeListService = {
    formatResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeSelectionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: EmployeeListService,
          useValue: mockEmployeeListService,
        },
      ],
    }).compile();

    service = module.get<EmployeeSelectionService>(EmployeeSelectionService);
    // prismaService = module.get<PrismaService>(PrismaService);
    // utilityService = module.get<UtilityService>(UtilityService);
    // employeeListService = module.get<EmployeeListService>(EmployeeListService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSelectableEmployees', () => {
    const mockEmployees = [
      {
        id: 1,
        accountId: 'acc1',
        employeeCode: 'EMP001',
        branchId: 1,
        activeContract: { employmentStatus: 'REGULAR' },
        account: {
          id: 'acc1',
          firstName: 'John',
          lastName: 'Doe',
          roleId: 'role1',
          companyId: 1,
        },
      },
      {
        id: 2,
        accountId: 'acc2',
        employeeCode: 'EMP002',
        branchId: 2,
        activeContract: { employmentStatus: 'CONTRACTTUAL' },
        account: {
          id: 'acc2',
          firstName: 'Jane',
          lastName: 'Smith',
          roleId: 'role2',
          companyId: 1,
        },
      },
    ];

    beforeEach(() => {
      mockPrismaService.employeeData.findMany.mockResolvedValue(mockEmployees);
      mockEmployeeListService.formatResponse.mockImplementation((employee) => ({
        id: employee.id,
        accountId: employee.accountId,
        employeeCode: employee.employeeCode,
        accountDetails: {
          id: employee.account.id,
          fullName: `${employee.account.firstName} ${employee.account.lastName}`,
        },
      }));
    });

    it('should return all employees when no filters are provided', async () => {
      const filters: EmployeeSelectionFilterDto = {};

      const result = await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
      expect(result).toHaveLength(2);
    });

    it('should exclude specified account IDs', async () => {
      const filters: EmployeeSelectionFilterDto = {
        excludeAccountIds: ['acc1'],
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
          NOT: {
            accountId: {
              in: ['acc1'],
            },
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should filter by branch', async () => {
      const filters: EmployeeSelectionFilterDto = {
        branch: '1',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
          branchId: 1,
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should filter by role', async () => {
      const filters: EmployeeSelectionFilterDto = {
        role: 'role1',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
            roleId: 'role1',
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should filter by employment status', async () => {
      const filters: EmployeeSelectionFilterDto = {
        employmentStatus: 'REGULAR',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
          activeContract: {
            employmentStatus: 'REGULAR',
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should filter by search term', async () => {
      const filters: EmployeeSelectionFilterDto = {
        search: 'john',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
          OR: [
            {
              account: {
                firstName: {
                  contains: 'john',
                  mode: 'insensitive',
                },
              },
            },
            {
              account: {
                lastName: {
                  contains: 'john',
                  mode: 'insensitive',
                },
              },
            },
            {
              employeeCode: {
                contains: 'john',
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should apply multiple filters', async () => {
      const filters: EmployeeSelectionFilterDto = {
        excludeAccountIds: ['acc1'],
        branch: '2',
        role: 'role2',
        employmentStatus: 'CONTRACTTUAL',
        search: 'smith',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
            roleId: 'role2',
          },
          NOT: {
            accountId: {
              in: ['acc1'],
            },
          },
          branchId: 2,
          activeContract: {
            employmentStatus: 'CONTRACTTUAL',
          },
          OR: [
            {
              account: {
                firstName: {
                  contains: 'smith',
                  mode: 'insensitive',
                },
              },
            },
            {
              account: {
                lastName: {
                  contains: 'smith',
                  mode: 'insensitive',
                },
              },
            },
            {
              employeeCode: {
                contains: 'smith',
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should ignore "all" values for filters', async () => {
      const filters: EmployeeSelectionFilterDto = {
        branch: 'all',
        role: 'all',
        employmentStatus: 'all',
      };

      await service.getSelectableEmployees(filters);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: 1,
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should use provided company ID when specified', async () => {
      const filters: EmployeeSelectionFilterDto = {};
      const customCompanyId = 2;

      await service.getSelectableEmployees(filters, customCompanyId);

      expect(mockPrismaService.employeeData.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            companyId: customCompanyId,
          },
        },
        orderBy: [
          { account: { lastName: 'asc' } },
          { account: { firstName: 'asc' } },
        ],
      });
    });

    it('should format responses using employeeListService', async () => {
      const filters: EmployeeSelectionFilterDto = {};

      const result = await service.getSelectableEmployees(filters);

      expect(mockEmployeeListService.formatResponse).toHaveBeenCalledTimes(2);
      expect(mockEmployeeListService.formatResponse).toHaveBeenCalledWith(
        mockEmployees[0],
        false,
        false,
        false,
        false,
      );
      expect(mockEmployeeListService.formatResponse).toHaveBeenCalledWith(
        mockEmployees[1],
        false,
        false,
        false,
        false,
      );
      expect(result[0].accountDetails.fullName).toBe('John Doe');
      expect(result[1].accountDetails.fullName).toBe('Jane Smith');
    });
  });
});
