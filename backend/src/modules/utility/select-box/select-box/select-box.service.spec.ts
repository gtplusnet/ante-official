import { Test, TestingModule } from '@nestjs/testing';
import { SelectBoxService } from './select-box.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import {
  createMockPrismaService,
  createMockUtilityService,
} from '../../../../../test/setup';

describe('SelectBoxService', () => {
  let service: SelectBoxService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockUtility: ReturnType<typeof createMockUtilityService>;
  let mockUserOrgService: Partial<UserOrgService>;

  const mockCompanyId = 'test-company-id';

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockUtility = createMockUtilityService();
    mockUtility.companyId = mockCompanyId;

    mockUserOrgService = {
      findParentUserDropdownList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectBoxService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UtilityService, useValue: mockUtility },
        { provide: UserOrgService, useValue: mockUserOrgService },
      ],
    }).compile();

    service = module.get<SelectBoxService>(SelectBoxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccountList', () => {
    const mockAccountWithRole = {
      id: 'account-1',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael',
      username: 'johndoe',
      email: 'john.doe@example.com',
      role: {
        id: 'role-1',
        name: 'Manager',
      },
    };

    const mockAccountWithoutMiddleName = {
      id: 'account-2',
      firstName: 'Jane',
      lastName: 'Smith',
      middleName: null,
      username: 'janesmith',
      email: 'jane.smith@example.com',
      role: {
        id: 'role-2',
        name: 'Developer',
      },
    };

    const mockAccountWithoutRole = {
      id: 'account-3',
      firstName: 'Bob',
      lastName: 'Johnson',
      middleName: 'Lee',
      username: 'bobjohnson',
      email: 'bob.johnson@example.com',
      role: null,
    };

    const mockAccountMinimalName = {
      id: 'account-4',
      firstName: 'Alice',
      lastName: 'Wilson',
      middleName: '',
      username: 'alicewilson',
      email: 'alice.wilson@example.com',
      role: {
        id: 'role-3',
        name: 'Analyst',
      },
    };

    describe('successful retrieval', () => {
      it('should return formatted account list with all required fields', async () => {
        const mockAccounts = [mockAccountWithRole];
        mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

        const result = await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            companyId: mockCompanyId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                roleGroup: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
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
        });
      });

      it('should handle multiple accounts with proper formatting', async () => {
        const mockAccounts = [
          mockAccountWithRole,
          mockAccountWithoutMiddleName,
          mockAccountWithoutRole,
        ];
        mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

        const result = await service.getAccountList();

        expect(result).toHaveLength(3);

        // Account with full name and role
        expect(result[0]).toEqual({
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
        });

        // Account without middle name but with role
        expect(result[1]).toEqual({
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
        });

        // Account without role
        expect(result[2]).toEqual({
          key: 'account-3',
          label: 'Bob Lee Johnson',
          firstName: 'Bob',
          lastName: 'Johnson',
          middleName: 'Lee',
          username: 'bobjohnson',
          email: 'bob.johnson@example.com',
          roleId: null,
          roleName: '',
          departmentId: null,
          departmentName: '',
        });
      });

      it('should return empty array when no accounts found', async () => {
        mockPrisma.account.findMany.mockResolvedValue([]);

        const result = await service.getAccountList();

        expect(result).toEqual([]);
        expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(1);
      });
    });

    describe('filtering and querying', () => {
      it('should filter by company ID', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              companyId: mockCompanyId,
            }),
          }),
        );
      });

      it('should exclude deleted accounts', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isDeleted: false,
            }),
          }),
        );
      });

      it('should order results alphabetically by firstName then lastName', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
          }),
        );
      });

      it('should include role information in select', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            select: expect.objectContaining({
              role: {
                select: {
                  id: true,
                  name: true,
                  roleGroup: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            }),
          }),
        );
      });
    });

    describe('response formatting', () => {
      it('should build full name with middle name when available', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        const result = await service.getAccountList();

        expect(result[0].label).toBe('John Michael Doe (Manager)');
      });

      it('should build full name without middle name when not available', async () => {
        mockPrisma.account.findMany.mockResolvedValue([
          mockAccountWithoutMiddleName,
        ]);

        const result = await service.getAccountList();

        expect(result[0].label).toBe('Jane Smith (Developer)');
      });

      it('should handle empty middle name as null', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountMinimalName]);

        const result = await service.getAccountList();

        // Empty string middle name should be filtered out
        expect(result[0].label).toBe('Alice Wilson (Analyst)');
      });

      it('should exclude role from label when account has no role', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithoutRole]);

        const result = await service.getAccountList();

        expect(result[0].label).toBe('Bob Lee Johnson');
        expect(result[0].roleId).toBeNull();
        expect(result[0].roleName).toBe('');
      });

      it('should set roleId and roleName correctly when role exists', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        const result = await service.getAccountList();

        expect(result[0].roleId).toBe('role-1');
        expect(result[0].roleName).toBe('Manager');
      });

      it('should set roleId to null and roleName to empty string when role is null', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithoutRole]);

        const result = await service.getAccountList();

        expect(result[0].roleId).toBeNull();
        expect(result[0].roleName).toBe('');
      });

      it('should use account id as key', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        const result = await service.getAccountList();

        expect(result[0].key).toBe('account-1');
      });

      it('should preserve all original account fields', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        const result = await service.getAccountList();

        expect(result[0]).toMatchObject({
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Michael',
          username: 'johndoe',
          email: 'john.doe@example.com',
        });
      });
    });

    describe('edge cases', () => {
      it('should handle accounts with undefined role gracefully', async () => {
        const accountWithUndefinedRole = {
          ...mockAccountWithoutRole,
          role: undefined,
        };
        mockPrisma.account.findMany.mockResolvedValue([
          accountWithUndefinedRole,
        ]);

        const result = await service.getAccountList();

        expect(result[0].roleId).toBeNull();
        expect(result[0].roleName).toBe('');
        expect(result[0].label).toBe('Bob Lee Johnson');
      });

      it('should handle special characters in names', async () => {
        const accountWithSpecialChars = {
          id: 'account-special',
          firstName: "O'Connor",
          lastName: 'Smith-Jones',
          middleName: 'José',
          username: 'oconnor.smith',
          email: 'oconnor@example.com',
          role: {
            id: 'role-special',
            name: 'Senior Manager',
          },
        };
        mockPrisma.account.findMany.mockResolvedValue([
          accountWithSpecialChars,
        ]);

        const result = await service.getAccountList();

        expect(result[0].label).toBe(
          "O'Connor José Smith-Jones (Senior Manager)",
        );
      });

      it('should filter out falsy middle names correctly', async () => {
        const testCases = [
          { ...mockAccountWithRole, middleName: null },
          { ...mockAccountWithRole, middleName: '' },
          { ...mockAccountWithRole, middleName: undefined },
        ];

        for (const testCase of testCases) {
          mockPrisma.account.findMany.mockResolvedValue([testCase]);

          const result = await service.getAccountList();

          expect(result[0].label).toBe('John Doe (Manager)');

          jest.clearAllMocks();
        }
      });

      it('should handle very long names appropriately', async () => {
        const accountWithLongNames = {
          id: 'account-long',
          firstName: 'Verylongfirstnamethatexceedsnormallimits',
          lastName: 'Verylonglastnamethatexceedsnormallimits',
          middleName: 'Verylongmiddlenamethatexceedsnormallimits',
          username: 'verylongusername',
          email: 'verylongemail@verylongdomain.com',
          role: {
            id: 'role-long',
            name: 'Very Long Role Name That Exceeds Normal Limits',
          },
        };
        mockPrisma.account.findMany.mockResolvedValue([accountWithLongNames]);

        const result = await service.getAccountList();

        expect(result[0].label).toContain(
          'Verylongfirstnamethatexceedsnormallimits',
        );
        expect(result[0].label).toContain(
          'Verylongmiddlenamethatexceedsnormallimits',
        );
        expect(result[0].label).toContain(
          'Verylonglastnamethatexceedsnormallimits',
        );
        expect(result[0].label).toContain(
          'Very Long Role Name That Exceeds Normal Limits',
        );
      });
    });

    describe('database error handling', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Database connection failed');
        mockPrisma.account.findMany.mockRejectedValue(dbError);

        await expect(service.getAccountList()).rejects.toThrow(
          'Database connection failed',
        );

        expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(1);
      });

      it('should handle timeout errors', async () => {
        const timeoutError = new Error('Query timeout');
        mockPrisma.account.findMany.mockRejectedValue(timeoutError);

        await expect(service.getAccountList()).rejects.toThrow('Query timeout');
      });
    });

    describe('data consistency', () => {
      it('should maintain consistent ordering across multiple calls', async () => {
        const unsortedAccounts = [
          { ...mockAccountWithRole, firstName: 'Zoe', id: 'z' },
          { ...mockAccountWithRole, firstName: 'Alice', id: 'a' },
          { ...mockAccountWithRole, firstName: 'Bob', id: 'b' },
        ];
        mockPrisma.account.findMany.mockResolvedValue(unsortedAccounts);

        const result1 = await service.getAccountList();
        const result2 = await service.getAccountList();

        expect(result1).toEqual(result2);
        expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(2);
      });

      it('should handle duplicate names correctly', async () => {
        const duplicateAccounts = [
          { ...mockAccountWithRole, id: 'account-1' },
          { ...mockAccountWithRole, id: 'account-2' },
        ];
        mockPrisma.account.findMany.mockResolvedValue(duplicateAccounts);

        const result = await service.getAccountList();

        expect(result).toHaveLength(2);
        expect(result[0].key).toBe('account-1');
        expect(result[1].key).toBe('account-2');
        expect(result[0].label).toBe(result[1].label);
      });
    });

    describe('performance considerations', () => {
      it('should make only one database call', async () => {
        mockPrisma.account.findMany.mockResolvedValue([mockAccountWithRole]);

        await service.getAccountList();

        expect(mockPrisma.account.findMany).toHaveBeenCalledTimes(1);
      });

      it('should handle large result sets efficiently', async () => {
        const largeAccountList = Array.from({ length: 1000 }, (_, i) => ({
          ...mockAccountWithRole,
          id: `account-${i}`,
          firstName: `User${i}`,
          email: `user${i}@example.com`,
        }));
        mockPrisma.account.findMany.mockResolvedValue(largeAccountList);

        const result = await service.getAccountList();

        expect(result).toHaveLength(1000);
        expect(result[0].key).toBe('account-0');
        expect(result[999].key).toBe('account-999');
      });
    });
  });
});
