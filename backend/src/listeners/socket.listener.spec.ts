import { Test, TestingModule } from '@nestjs/testing';
import { SocketListener } from './socket.listener';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { PrismaService } from '@common/prisma.service';
import { RoleService } from '@modules/role/role/role.service';
import { CompanyService } from '@modules/company/company/company.service';
import {
  AccountUpdatedEvent,
  RoleUpdatedEvent,
} from '../events/account.events';

describe('SocketListener', () => {
  let listener: SocketListener;

  const mockSocketService = {
    emitToClients: jest.fn(),
  };

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  const mockRoleService = {
    getRole: jest.fn(),
  };

  const mockCompanyService = {
    getInformation: jest.fn(),
  };

  const mockAccount = {
    id: 'account-id-123',
    firstName: 'john',
    lastName: 'doe',
    middleName: 'smith',
    email: 'john.doe@example.com',
    username: 'johndoe',
    contactNumber: '1234567890',
    status: 'ACTIVE',
    image: 'profile.jpg',
    roleId: 'role-id-123',
    companyId: 1,
    parentAccountId: null,
    isDeleted: false,
    isDeveloper: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  };

  const mockRole = {
    id: 'role-id-123',
    name: 'Test Role',
    description: 'Test Role Description',
    level: 1,
    permissions: [],
    isDeleted: false,
  };

  const mockCompany = {
    id: '1',
    name: 'Test Company',
    email: 'company@test.com',
    address: '123 Test Street',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketListener,
        { provide: SocketService, useValue: mockSocketService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: CompanyService, useValue: mockCompanyService },
      ],
    }).compile();

    listener = module.get<SocketListener>(SocketListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleAccountUpdated', () => {
    it('should handle account deactivation event', async () => {
      const event = new AccountUpdatedEvent('account-id-123', 'deactivation');

      await listener.handleAccountUpdated(event);

      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['account-id-123'],
        'account-deactivated',
        {
          accountId: 'account-id-123',
          timestamp: expect.any(String),
          message: 'Your account has been deactivated. You will be logged out.',
        },
      );
    });

    it('should handle password change by admin event', async () => {
      const event = new AccountUpdatedEvent(
        'account-id-123',
        'password',
        'admin',
      );

      await listener.handleAccountUpdated(event);

      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['account-id-123'],
        'password-changed',
        {
          changedBy: 'admin',
          timestamp: expect.any(String),
          message:
            'Your password has been changed by an administrator. Please use your new password to log in.',
        },
      );
    });

    it('should handle password change by self event', async () => {
      const event = new AccountUpdatedEvent(
        'account-id-123',
        'password',
        'self',
      );

      await listener.handleAccountUpdated(event);

      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['account-id-123'],
        'password-changed',
        {
          changedBy: 'self',
          timestamp: expect.any(String),
          message: 'Your password has been successfully updated.',
        },
      );
    });

    it('should handle general account update event', async () => {
      const event = new AccountUpdatedEvent('account-id-123', 'profile');

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      await listener.handleAccountUpdated(event);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-id-123' },
      });

      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['account-id-123'],
        'account-updated',
        {
          accountInformation: {
            id: 'account-id-123',
            firstName: 'john',
            lastName: 'doe',
            middleName: 'smith',
            fullName: 'Doe, John Smith',
            contactNumber: '1234567890',
            email: 'john.doe@example.com',
            status: 'ACTIVE',
            username: 'johndoe',
            image: 'profile.jpg',
            roleID: 'role-id-123',
            role: mockRole,
            company: mockCompany,
            parentAccountId: null,
            companyId: 1,
            createdAt: mockAccount.createdAt,
            updatedAt: mockAccount.updatedAt,
            isDeleted: false,
            isDeveloper: false,
          },
          timestamp: expect.any(String),
        },
      );
    });

    it('should not emit event when account is not found', async () => {
      const event = new AccountUpdatedEvent('account-id-123', 'profile');

      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await listener.handleAccountUpdated(event);

      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();
    });

    it('should not emit event when account is deleted', async () => {
      const event = new AccountUpdatedEvent('account-id-123', 'profile');
      const deletedAccount = { ...mockAccount, isDeleted: true };

      mockPrismaService.account.findUnique.mockResolvedValue(deletedAccount);

      await listener.handleAccountUpdated(event);

      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const event = new AccountUpdatedEvent('account-id-123', 'profile');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockPrismaService.account.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await listener.handleAccountUpdated(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in account updated event handler:',
        expect.any(Error),
      );
      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handleRoleUpdated', () => {
    it('should handle role updated event and emit to affected users', async () => {
      const event = new RoleUpdatedEvent('role-id-123');
      const accountsWithRole = [
        { id: 'account-1' },
        { id: 'account-2' },
        { id: 'account-3' },
      ];

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.account.findMany.mockResolvedValue(accountsWithRole);

      await listener.handleRoleUpdated(event);

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-id-123' },
      });

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: {
          roleId: 'role-id-123',
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['account-1', 'account-2', 'account-3'],
        'role-updated',
        {
          roleId: 'role-id-123',
          role: mockRole,
          timestamp: expect.any(String),
        },
      );
    });

    it('should not emit event when role is not found', async () => {
      const event = new RoleUpdatedEvent('nonexistent-role-id');

      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await listener.handleRoleUpdated(event);

      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();
      expect(mockPrismaService.account.findMany).not.toHaveBeenCalled();
    });

    it('should not emit event when no accounts have the role', async () => {
      const event = new RoleUpdatedEvent('role-id-123');

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.account.findMany.mockResolvedValue([]);

      await listener.handleRoleUpdated(event);

      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const event = new RoleUpdatedEvent('role-id-123');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockPrismaService.role.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await listener.handleRoleUpdated(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in role updated event handler:',
        expect.any(Error),
      );
      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('formatAccountData', () => {
    it('should format account data correctly', async () => {
      mockRoleService.getRole.mockResolvedValue(mockRole);
      mockCompanyService.getInformation.mockResolvedValue(mockCompany);

      const result = await (listener as any).formatAccountData(mockAccount);

      expect(result).toEqual({
        id: 'account-id-123',
        firstName: 'john',
        lastName: 'doe',
        middleName: 'smith',
        fullName: 'Doe, John Smith',
        contactNumber: '1234567890',
        email: 'john.doe@example.com',
        status: 'ACTIVE',
        username: 'johndoe',
        image: 'profile.jpg',
        roleID: 'role-id-123',
        role: mockRole,
        company: mockCompany,
        parentAccountId: null,
        companyId: 1,
        createdAt: mockAccount.createdAt,
        updatedAt: mockAccount.updatedAt,
        isDeleted: false,
        isDeveloper: false,
      });

      expect(mockRoleService.getRole).toHaveBeenCalledWith({
        id: 'role-id-123',
      });
      expect(mockCompanyService.getInformation).toHaveBeenCalledWith(1);
    });

    it('should handle account without company', async () => {
      const accountWithoutCompany = { ...mockAccount, companyId: null };

      mockRoleService.getRole.mockResolvedValue(mockRole);

      const result = await (listener as any).formatAccountData(
        accountWithoutCompany,
      );

      expect(result.company).toBeNull();
      expect(mockCompanyService.getInformation).not.toHaveBeenCalled();
    });
  });

  describe('setFullName', () => {
    it('should format full name correctly', () => {
      const accountData = {
        firstName: 'john',
        lastName: 'doe',
        middleName: 'smith',
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('Doe, John Smith');
    });

    it('should handle missing middle name', () => {
      const accountData = {
        firstName: 'john',
        lastName: 'doe',
        middleName: null,
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('Doe, John');
    });

    it('should handle missing first name', () => {
      const accountData = {
        firstName: null,
        lastName: 'doe',
        middleName: 'smith',
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('Doe,  Smith');
    });

    it('should return empty string when all names are missing', () => {
      const accountData = {
        firstName: null,
        lastName: null,
        middleName: null,
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('');
    });

    it('should handle empty strings', () => {
      const accountData = {
        firstName: '',
        lastName: 'doe',
        middleName: '',
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('Doe,');
    });

    it('should capitalize names correctly', () => {
      const accountData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        middleName: 'SMITH',
      };

      const result = (listener as any).setFullName(accountData);

      expect(result).toBe('DOE, JOHN SMITH');
    });
  });
});
