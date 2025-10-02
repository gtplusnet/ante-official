import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { EncryptionService } from '@common/encryption.service';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import { RoleService } from '@modules/role/role/role.service';
import { CompanyService } from '../../company/company/company.service';
import { ExcelExportService } from '@common/services/excel-export.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateAccountDto, ChangePasswordDto } from './dto/update-account.dto';
import { AccountCreateDTO, ChangePasswordDTO } from './account.validator';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AccountService', () => {
  let service: AccountService;

  const mockAccount: any = {
    id: 'test-account-id',
    firstName: 'Test',
    lastName: 'User',
    middleName: 'Middle',
    email: 'test@example.com',
    username: 'testuser',
    password: 'encrypted-password',
    key: Buffer.from('encryption-key'),
    phone: '1234567890',
    image: null,
    isDeleted: false,
    isInviteAccepted: true,
    companyId: 1,
    roleId: 'test-role-id',
    parentAccountId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contactNumber: '1234567890',
    status: 'ACTIVE',
    isEmailVerified: true,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'M',
    civilStatus: 'SINGLE',
    street: '123 Test St',
    city: 'Test City',
    stateProvince: 'Test State',
    postalCode: '12345',
    zipCode: '12345',
    country: 'Test Country',
    googleId: null,
    facebookId: null,
    googleEmail: null,
    facebookEmail: null,
    authProvider: 'LOCAL',
    parentId: null,
    searchKeyword: 'test user test@example.com testuser',
  };

  const mockRole: any = {
    id: 'test-role-id',
    name: 'Test Role',
    description: 'Test Description',
    level: 1,
    permissions: [],
    isDeleted: false,
    companyId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeveloper: false,
  };

  const mockCompany = {
    id: '1',
    name: 'Test Company',
    email: 'company@test.com',
    address: '123 Company St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    accountInvite: {
      findMany: jest.fn(),
    },
  };

  const mockUtilityService = {
    accountInformation: {
      id: 'current-user-id',
      companyId: 1,
    },
    companyId: 1,
    formatDate: jest.fn().mockReturnValue('2023-01-01 00:00:00'),
    log: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decryptAndCompare: jest.fn(),
  };

  const mockTableHandlerService = {
    initialize: jest.fn(),
    constructTableQuery: jest.fn(),
    getTableData: jest.fn(),
  };

  const mockUploadPhotoService = {
    uploadPhoto: jest.fn(),
  };

  const mockRoleService = {
    getRole: jest.fn(),
    seedInitialRole: jest.fn(),
  };

  const mockCompanyService = {
    getInformation: jest.fn(),
  };

  const mockExcelExportService = {
    exportToExcel: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: TableHandlerService, useValue: mockTableHandlerService },
        { provide: UploadPhotoService, useValue: mockUploadPhotoService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: CompanyService, useValue: mockCompanyService },
        { provide: ExcelExportService, useValue: mockExcelExportService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    it('should successfully change password for admin', async () => {
      const changePasswordDto: ChangePasswordDTO = {
        id: 'test-account-id',
        password: 'newPassword123',
      };

      const encryptionResult = {
        encrypted: 'encrypted-new-password',
        iv: Buffer.from('new-encryption-key'),
      };

      const updatedAccount = {
        ...mockAccount,
        password: encryptionResult.encrypted,
        key: encryptionResult.iv,
      };

      const mockHashedPassword =
        '$2b$10$mA6WuqMFoegSDKE779hmEezR2CrMl3UDBW6/xHG43Dkf1/SdAxXiq';

      mockEncryptionService.encrypt.mockResolvedValue(encryptionResult);
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.changePassword(changePasswordDto);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        'newPassword123',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
        data: {
          password: encryptionResult.encrypted,
          key: encryptionResult.iv,
          passwordHash: mockHashedPassword,
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('changeProfilePicture', () => {
    it('should remove profile picture when null is provided', async () => {
      const updatedAccount = { ...mockAccount, image: null };
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      const result = await service.changeProfilePicture(null);

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'current-user-id' },
        data: { image: null },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toEqual({ image: null });
    });

    it('should upload new profile picture when file is provided', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      const uploadedPath = 'uploads/profile-pictures/test.jpg';
      const updatedAccount = { ...mockAccount, image: uploadedPath };

      mockUploadPhotoService.uploadPhoto.mockResolvedValue(uploadedPath);
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      const result = await service.changeProfilePicture(mockFile);

      expect(mockUploadPhotoService.uploadPhoto).toHaveBeenCalledWith(mockFile);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'current-user-id' },
        data: { image: uploadedPath },
      });
      expect(result).toEqual({ image: uploadedPath });
    });
  });

  describe('updateProfile', () => {
    it('should successfully update profile', async () => {
      const updateDto: UpdateAccountDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        phone: '9876543210',
      };

      const updatedAccount = { ...mockAccount, ...updateDto };
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.updateProfile('test-account-id', updateDto);

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
        data: updateDto,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('changeUserPassword', () => {
    it('should successfully change user password when current password is correct', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const encryptionResult = {
        encrypted: 'encrypted-new-password',
        iv: Buffer.from('new-encryption-key'),
      };

      const mockHashedPassword =
        '$2b$10$mA6WuqMFoegSDKE779hmEezR2CrMl3UDBW6/xHG43Dkf1/SdAxXiq';

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockEncryptionService.decryptAndCompare.mockResolvedValue(true);
      mockEncryptionService.encrypt.mockResolvedValue(encryptionResult);
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      mockPrismaService.account.update.mockResolvedValue({ ...mockAccount });

      const result = await service.changeUserPassword(
        'test-account-id',
        changePasswordDto,
      );

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
      });
      expect(mockEncryptionService.decryptAndCompare).toHaveBeenCalledWith(
        'currentPassword',
        mockAccount.password,
        mockAccount.key,
      );
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        'newPassword123',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(result).toEqual({
        success: true,
        message: 'Password updated successfully',
      });
    });

    it('should throw NotFoundException when account is not found', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(
        service.changeUserPassword('nonexistent-id', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockEncryptionService.decryptAndCompare.mockResolvedValue(false);

      await expect(
        service.changeUserPassword('test-account-id', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when new passwords do not match', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockEncryptionService.decryptAndCompare.mockResolvedValue(true);

      await expect(
        service.changeUserPassword('test-account-id', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('accountTable', () => {
    it('should return formatted account table data', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };

      const mockTableData = {
        list: [mockAccount],
        currentPage: 1,
        totalCount: 1,
        pagination: {
          totalPages: 1,
          totalRecords: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockTableHandlerService.initialize.mockImplementation();
      mockTableHandlerService.constructTableQuery.mockReturnValue({
        where: { isDeleted: false, companyId: 1, isInviteAccepted: true },
        include: { role: { include: true }, parent: true },
        relationLoadStrategy: 'join',
        take: 10,
        skip: 0,
        orderBy: {},
      });
      mockTableHandlerService.getTableData.mockResolvedValue(mockTableData);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.accountTable(query, body);

      expect(mockTableHandlerService.initialize).toHaveBeenCalledWith(
        query,
        body,
        'account',
      );
      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('currentPage');
    });
  });

  describe('getAccountInformation', () => {
    it('should return formatted account information', async () => {
      const accountWithRelations = {
        ...mockAccount,
        role: {
          ...mockRole,
          roleGroup: null,
          parentRole: null,
        },
      };

      mockPrismaService.account.findFirst.mockResolvedValue(
        accountWithRelations,
      );
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.getAccountInformation({
        id: 'test-account-id',
      });

      expect(mockPrismaService.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
        include: {
          role: {
            include: {
              roleGroup: true,
              parentRole: true,
            },
          },
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('createAccount', () => {
    const mockAccountCreateDTO: AccountCreateDTO = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      middleName: 'Middle',
      contactNumber: '1234567890',
      roleID: 'role-id',
      parentAccountId: null,
      image: 'profile.jpg',
      sourceUrl: 'http://example.com',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'M',
      companyId: 1,
    };

    it('should successfully create a new account', async () => {
      const roleWithLevel = { ...mockRole, level: 1 };
      const encryptionResult = {
        encrypted: 'encrypted-password',
        iv: Buffer.from('encryption-key'),
      };
      const createdAccount = { ...mockAccount, ...mockAccountCreateDTO };

      const mockHashedPassword =
        '$2b$10$mA6WuqMFoegSDKE779hmEezR2CrMl3UDBW6/xHG43Dkf1/SdAxXiq';

      process.env.DEVELOPER_KEY = 'test-key';
      mockPrismaService.role.findFirst.mockResolvedValue(roleWithLevel);
      mockEncryptionService.encrypt.mockResolvedValue(encryptionResult);
      mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      mockPrismaService.account.findFirst
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check
      mockPrismaService.account.create.mockResolvedValue(createdAccount);
      mockRoleService.getRole.mockResolvedValue(roleWithLevel);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.createAccount(mockAccountCreateDTO);

      expect(mockPrismaService.role.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountCreateDTO.roleID },
      });
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        mockAccountCreateDTO.password,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        mockAccountCreateDTO.password,
        10,
      );
      expect(mockPrismaService.account.create).toHaveBeenCalled();
      expect(mockUtilityService.log).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for invalid role ID', async () => {
      process.env.DEVELOPER_KEY = 'test-key';
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.createAccount(mockAccountCreateDTO)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when email already exists', async () => {
      const roleWithLevel = { ...mockRole, level: 1 };
      const existingAccount = { ...mockAccount };

      process.env.DEVELOPER_KEY = 'test-key';
      mockPrismaService.role.findFirst.mockResolvedValue(roleWithLevel);
      mockPrismaService.account.findFirst.mockResolvedValueOnce(
        existingAccount,
      );

      await expect(service.createAccount(mockAccountCreateDTO)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for level 0 role with parent', async () => {
      const roleWithLevel0 = { ...mockRole, level: 0 };
      const createDTOWithParent = {
        ...mockAccountCreateDTO,
        parentAccountId: 'parent-id',
      };

      process.env.DEVELOPER_KEY = 'test-key';
      mockPrismaService.role.findFirst.mockResolvedValue(roleWithLevel0);
      mockPrismaService.account.findFirst
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      await expect(service.createAccount(createDTOWithParent)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete user', async () => {
      const accountToDelete = {
        ...mockAccount,
        role: { ...mockRole, level: 1 },
      };
      const deletedAccount = { ...accountToDelete, isDeleted: true };

      // Mock utility service to return different user ID
      mockUtilityService.accountInformation.id = 'different-user-id';
      mockPrismaService.account.findFirst
        .mockResolvedValueOnce(accountToDelete) // account to delete
        .mockResolvedValueOnce(null); // no child accounts
      mockPrismaService.account.count.mockResolvedValue(3); // enough super admins
      mockPrismaService.account.update.mockResolvedValue(deletedAccount);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.deleteUser({ id: 'test-account-id' });

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
        data: { isDeleted: true },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteUser({ id: 'nonexistent-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when trying to delete last super admin', async () => {
      const superAdminAccount = {
        ...mockAccount,
        role: { ...mockRole, level: 0 },
      };

      mockPrismaService.account.findFirst.mockResolvedValue(superAdminAccount);
      mockPrismaService.account.count.mockResolvedValue(1); // only one super admin

      await expect(
        service.deleteUser({ id: 'test-account-id' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreUser', () => {
    it('should restore deleted user', async () => {
      const deletedAccount = { ...mockAccount, isDeleted: true };
      const restoredAccount = { ...mockAccount, isDeleted: false };

      mockPrismaService.account.findUnique.mockResolvedValue(deletedAccount);
      mockPrismaService.account.update.mockResolvedValue(restoredAccount);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.restoreUser('test-account-id');

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'test-account-id' },
        data: { isDeleted: false },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.restoreUser('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when account is already active', async () => {
      const activeAccount = { ...mockAccount, isDeleted: false };
      mockPrismaService.account.findUnique.mockResolvedValue(activeAccount);

      await expect(service.restoreUser('test-account-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('exportAccountsToExcel', () => {
    it('should export accounts to Excel', async () => {
      const accounts = [{ ...mockAccount, role: mockRole }];
      const roles = [mockRole];
      const mockBuffer = Buffer.from('excel-data');

      mockPrismaService.account.findMany.mockResolvedValue(accounts);
      mockPrismaService.role.findMany.mockResolvedValue(roles);
      mockExcelExportService.exportToExcel.mockResolvedValue(mockBuffer);

      const result = await service.exportAccountsToExcel();

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false, companyId: 1 },
        include: { role: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });
      expect(mockExcelExportService.exportToExcel).toHaveBeenCalled();
      expect(result).toBe(mockBuffer);
    });
  });

  describe('getAuthMethods', () => {
    it('should return auth methods for account', async () => {
      const accountWithAuth = {
        ...mockAccount,
        password: 'encrypted-password',
        googleId: 'google-id',
        googleEmail: 'google@example.com',
        facebookId: null,
        facebookEmail: null,
        authProvider: 'GOOGLE',
      };

      mockPrismaService.account.findUnique.mockResolvedValue(accountWithAuth);

      const result = await service.getAuthMethods('test-account-id');

      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: true,
        hasFacebook: false,
        googleEmail: 'google@example.com',
        facebookEmail: null,
        primaryMethod: 'GOOGLE',
        connectedMethods: 2,
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.getAuthMethods('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchAccount', () => {
    it('should search accounts with query', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10, search: 'test' };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };

      const mockTableData = {
        list: [mockAccount],
        currentPage: 1,
        totalCount: 1,
        pagination: { totalPages: 1, totalRecords: 1 },
      };

      mockTableHandlerService.initialize.mockImplementation();
      mockTableHandlerService.constructTableQuery.mockReturnValue({
        where: {
          companyId: 1,
          OR: [
            { firstName: { contains: 'test', mode: 'insensitive' } },
            { lastName: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
      mockTableHandlerService.getTableData.mockResolvedValue(mockTableData);

      const result = await service.searchAccount(query, body, 'test');

      expect(mockTableHandlerService.initialize).toHaveBeenCalledWith(
        query,
        body,
        'account',
      );
      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result.list).toHaveLength(1);
    });
  });

  describe('generateSearchKeyword', () => {
    it('should generate search keyword from account data', () => {
      const accountData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
      };

      const result = (service as any).generateSearchKeyword(accountData);

      expect(result).toBe('john doe john.doe@example.com johndoe');
    });

    it('should handle null/undefined values in generateSearchKeyword', () => {
      const accountData = {
        firstName: null,
        lastName: 'Doe',
        email: undefined,
        username: 'johndoe',
      };

      const result = (service as any).generateSearchKeyword(accountData);

      expect(result).toBe('doe  johndoe');
    });
  });

  describe('setFullName', () => {
    it('should format full name correctly', () => {
      const account = {
        ...mockAccount,
        firstName: 'john',
        lastName: 'doe',
        middleName: 'smith',
      };

      const result = (service as any).setFullName(account);

      expect(result).toBe('Doe, John Smith');
    });
  });

  describe('accountsNotSetupTable', () => {
    it('should return accounts without EmployeeData and fix undefined orderBy', async () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: undefined,
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };

      const mockTableData = {
        list: [mockAccount],
        currentPage: 1,
        totalCount: 1,
        pagination: { totalPages: 1, totalRecords: 1 },
      };

      mockTableHandlerService.initialize.mockImplementation();
      mockTableHandlerService.constructTableQuery.mockReturnValue({
        orderBy: { undefined: 'asc' }, // This should be fixed by the service
        take: 10,
        skip: 0,
        where: {},
      });
      mockTableHandlerService.getTableData.mockResolvedValue(mockTableData);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await service.accountsNotSetupTable(query, body);

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
    });
  });
});
