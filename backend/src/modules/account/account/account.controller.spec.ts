import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UtilityService } from '@common/utility.service';
import { AuthService } from '../../auth/auth/auth.service';
import { RoleService } from '@modules/role/role/role.service';
import { InviteService } from '../../auth/auth/invite.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

describe('AccountController - accountsNotSetup endpoint', () => {
  let controller: AccountController;
  let mockAccountService: jest.Mocked<AccountService>;
  let mockUtilityService: jest.Mocked<UtilityService>;

  const mockTableQuery: TableQueryDTO = {
    page: 1,
    perPage: 10,
    search: '',
  };

  const mockTableBody: TableBodyDTO = {
    filters: [],
    settings: {},
    searchKeyword: '',
  };

  const mockAccountsNotSetupResponse = {
    list: [
      {
        id: 'test-account-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        middleName: 'A',
        lastName: 'Doe',
        fullName: 'John A Doe',
        contactNumber: '1234567890',
        username: 'johndoe',
        roleID: 'test-role-id',
        role: {
          id: 'test-role-id',
          name: 'Employee',
          description: 'Employee role',
          isDeveloper: false,
          isDeleted: false,
          roleGroupId: 'test-role-group-id',
          level: 1,
          parentRole: null,
          roleGroup: {
            id: 'test-role-group-id',
            name: 'Standard',
            description: 'Standard role group',
          },
          userLevels: [],
          isFullAccess: false,
          employeeCount: 0,
          updatedAt: {
            dateTime: '2023-01-01T00:00:00.000Z',
            time: '12:00 AM',
            time24: '00:00',
            date: '01/01/2023',
            dateStandard: 'January 1, 2023',
            dateFull: 'Sunday, January 1, 2023',
            raw: new Date('2023-01-01T00:00:00.000Z'),
            timeAgo: '1 year ago',
            day: 'Sunday',
            daySmall: 'Sun',
          },
          createdAt: {
            dateTime: '2023-01-01T00:00:00.000Z',
            time: '12:00 AM',
            time24: '00:00',
            date: '01/01/2023',
            dateStandard: 'January 1, 2023',
            dateFull: 'Sunday, January 1, 2023',
            raw: new Date('2023-01-01T00:00:00.000Z'),
            timeAgo: '1 year ago',
            day: 'Sunday',
            daySmall: 'Sun',
          },
          scopeList: [],
        },
        company: {
          id: 1,
          companyName: 'Test Company',
          domainPrefix: 'test',
          businessType: 'CORPORATION',
          industry: 'TECHNOLOGY',
          businessTypeData: { label: 'Corporation', value: 'CORPORATION' },
          industryData: { label: 'Technology', value: 'TECHNOLOGY' },
          registrationNo: '12345678',
          website: 'https://test.com',
          email: 'info@test.com',
          phone: '+1234567890',
          tinNo: '987654321',
          address: '123 Test Street, Test City',
          logoUrl: 'https://test.com/logo.png',
          isActive: true,
          createdAt: {
            dateTime: '2023-01-01T00:00:00.000Z',
            time: '12:00 AM',
            time24: '00:00',
            date: '01/01/2023',
            dateStandard: 'January 1, 2023',
            dateFull: 'Sunday, January 1, 2023',
            raw: new Date('2023-01-01T00:00:00.000Z'),
            timeAgo: '1 year ago',
            day: 'Sunday',
            daySmall: 'Sun',
          },
          updatedAt: {
            dateTime: '2023-01-01T00:00:00.000Z',
            time: '12:00 AM',
            time24: '00:00',
            date: '01/01/2023',
            dateStandard: 'January 1, 2023',
            dateFull: 'Sunday, January 1, 2023',
            raw: new Date('2023-01-01T00:00:00.000Z'),
            timeAgo: '1 year ago',
            day: 'Sunday',
            daySmall: 'Sun',
          },
        },
        parentAccountId: null,
        status: 'active',
        image: 'profile.jpg',
        createdAt: {
          dateTime: '2023-01-01T00:00:00.000Z',
          time: '12:00 AM',
          time24: '00:00',
          date: '01/01/2023',
          dateStandard: 'January 1, 2023',
          dateFull: 'Sunday, January 1, 2023',
          raw: new Date('2023-01-01T00:00:00.000Z'),
          timeAgo: '1 year ago',
          day: 'Sunday',
          daySmall: 'Sun',
        },
        updatedAt: {
          dateTime: '2023-01-01T00:00:00.000Z',
          time: '12:00 AM',
          time24: '00:00',
          date: '01/01/2023',
          dateStandard: 'January 1, 2023',
          dateFull: 'Sunday, January 1, 2023',
          raw: new Date('2023-01-01T00:00:00.000Z'),
          timeAgo: '1 year ago',
          day: 'Sunday',
          daySmall: 'Sun',
        },
        isDeveloper: false,
        isDeleted: false,
        isEmailVerified: true,
        dateOfBirth: null,
        gender: null,
        civilStatus: null,
        street: null,
        city: null,
        stateProvince: null,
        postalCode: null,
        zipCode: null,
        country: null,
      },
    ],
    pagination: [1],
    currentPage: 1,
  };

  beforeEach(async () => {
    const mockAccountServiceMethods = {
      accountsNotSetupTable: jest.fn(),
      exportAccountsToExcel: jest.fn(),
      getAccountInformation: jest.fn(),
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteUser: jest.fn(),
      accountTable: jest.fn(),
      changePassword: jest.fn(),
      changeProfilePicture: jest.fn(),
      updateProfile: jest.fn(),
      changeUserPassword: jest.fn(),
      searchAssignees: jest.fn(),
      searchAccount: jest.fn(),
    };

    const mockUtilityServiceMethods = {
      responseHandler: jest.fn(),
      accountInformation: { id: 'test-user-id' },
    };

    const mockAuthServiceMethods = {
      login: jest.fn(),
      signup: jest.fn(),
      validateToken: jest.fn(),
    };

    const mockRoleServiceMethods = {
      hasOneUserPerRoleHead: jest.fn(),
      seedInitialRole: jest.fn(),
    };

    const mockInviteServiceMethods = {
      createInvite: jest.fn(),
      resendInvite: jest.fn(),
      cancelInvite: jest.fn(),
      processInvite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockAccountServiceMethods,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityServiceMethods,
        },
        {
          provide: AuthService,
          useValue: mockAuthServiceMethods,
        },
        {
          provide: RoleService,
          useValue: mockRoleServiceMethods,
        },
        {
          provide: InviteService,
          useValue: mockInviteServiceMethods,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    mockAccountService = module.get(AccountService);
    mockUtilityService = module.get(UtilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('accountsNotSetup', () => {
    it('should call accountService.accountsNotSetupTable with correct parameters', async () => {
      const mockResponse = {} as any;
      mockAccountService.accountsNotSetupTable.mockResolvedValue(
        mockAccountsNotSetupResponse,
      );

      await controller.accountsNotSetup(
        mockResponse,
        mockTableQuery,
        mockTableBody,
      );

      expect(mockAccountService.accountsNotSetupTable).toHaveBeenCalledWith(
        mockTableQuery,
        mockTableBody,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockAccountService.accountsNotSetupTable(mockTableQuery, mockTableBody),
        mockResponse,
      );
    });

    it('should handle the response correctly', async () => {
      const mockResponse = {} as any;
      mockAccountService.accountsNotSetupTable.mockResolvedValue(
        mockAccountsNotSetupResponse,
      );

      await controller.accountsNotSetup(
        mockResponse,
        mockTableQuery,
        mockTableBody,
      );

      expect(mockUtilityService.responseHandler).toHaveBeenCalledTimes(1);
    });
  });
});
