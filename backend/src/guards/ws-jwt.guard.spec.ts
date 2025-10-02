import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { WsAdminGuard } from './ws-jwt.guard';
import { PrismaService } from '../lib/prisma.service';
import { UtilityService } from '../lib/utility.service';
import { AccountService } from '@modules/account/account/account.service';
import { AccountTokenInterface } from '../interfaces';
import { AccountSocketDataInterface } from '@modules/communication/socket/socket/socket.interface';

describe('WsAdminGuard', () => {
  let guard: WsAdminGuard;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockUtilityService: jest.Mocked<UtilityService>;
  let mockAccountService: jest.Mocked<AccountService>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockClient: any;

  const mockToken = 'valid-token-123';
  const mockAccountToken: AccountTokenInterface = {
    sessionId: '1',
    accountId: 'account-123',
    payload: 'test-payload',
    userAgent: 'test-agent',
    token: mockToken,
    ipAddress: '127.0.0.1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccountInfo: AccountSocketDataInterface = {
    id: 'account-123',
    email: 'test@example.com',
    firstName: 'Test',
    middleName: 'Middle',
    lastName: 'User',
    fullName: 'Test Middle User',
    contactNumber: '123-456-7890',
    username: 'testuser',
    roleID: 'role-123',
    company: null,
    parentAccountId: null,
    status: 'active',
    image: 'avatar.jpg',
    isDeveloper: false,
    socket: [],
    createdAt: {
      dateTime: new Date().toISOString(),
      time: '12:00:00',
      time24: '12:00',
      date: new Date().toISOString().split('T')[0],
      dateStandard: new Date().toISOString().split('T')[0],
      dateFull: new Date().toDateString(),
      raw: new Date(),
      timeAgo: 'just now',
      day: 'Today',
      daySmall: 'tod',
    },
    updatedAt: {
      dateTime: new Date().toISOString(),
      time: '12:00:00',
      time24: '12:00',
      date: new Date().toISOString().split('T')[0],
      dateStandard: new Date().toISOString().split('T')[0],
      dateFull: new Date().toDateString(),
      raw: new Date(),
      timeAgo: 'just now',
      day: 'Today',
      daySmall: 'tod',
    },
    role: {
      id: 'role-123',
      name: 'Admin',
      description: 'Administrator role',
      isDeveloper: false,
      isDeleted: false,
      roleGroupId: 'group-123',
      level: 1,
      parentRole: null,
      roleGroup: {
        id: 'group-123',
        name: 'Admin Group',
        description: 'Administrator role group',
      },
      userLevels: [],
      isFullAccess: true,
      employeeCount: 1,
      updatedAt: {
        dateTime: new Date().toISOString(),
        time: '12:00:00',
        time24: '12:00',
        date: new Date().toISOString().split('T')[0],
        dateStandard: new Date().toISOString().split('T')[0],
        dateFull: new Date().toDateString(),
        raw: new Date(),
        timeAgo: 'just now',
        day: 'Today',
        daySmall: 'tod',
      },
      createdAt: {
        dateTime: new Date().toISOString(),
        time: '12:00:00',
        time24: '12:00',
        date: new Date().toISOString().split('T')[0],
        dateStandard: new Date().toISOString().split('T')[0],
        dateFull: new Date().toDateString(),
        raw: new Date(),
        timeAgo: 'just now',
        day: 'Today',
        daySmall: 'tod',
      },
      scopeList: [],
    },
  };

  beforeEach(async () => {
    mockClient = {
      handshake: {
        auth: { token: mockToken },
        headers: { token: mockToken },
      },
    };

    mockPrisma = {
      accountToken: {
        findFirst: jest.fn(),
      },
      account: {
        findFirst: jest.fn(),
      },
    } as any;

    mockUtilityService = {
      setAccountInformation: jest.fn(),
    } as any;

    mockAccountService = {
      getAccountInformation: jest.fn(),
    } as any;

    mockContext = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(mockClient),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAdminGuard,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: AccountService, useValue: mockAccountService },
      ],
    }).compile();

    guard = module.get<WsAdminGuard>(WsAdminGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should have a logger', () => {
    expect((guard as any).logger).toBeInstanceOf(Logger);
  });

  describe('canActivate', () => {
    it('should return true for valid authentication', async () => {
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(mockAccountInfo);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockContext.switchToWs).toHaveBeenCalled();
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken },
      });
      expect(mockAccountService.getAccountInformation).toHaveBeenCalledWith({
        id: mockAccountToken.accountId,
      });
      expect(mockUtilityService.setAccountInformation).toHaveBeenCalledWith(
        mockAccountInfo,
      );
    });

    it('should return false when token is invalid', async () => {
      mockPrisma.accountToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockAccountService.getAccountInformation).not.toHaveBeenCalled();
      expect(mockUtilityService.setAccountInformation).not.toHaveBeenCalled();
    });

    it('should return false when account information is not found', async () => {
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockUtilityService.setAccountInformation).not.toHaveBeenCalled();
    });

    it('should extract token from auth when available', async () => {
      mockClient.handshake.auth = { token: mockToken };
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(mockAccountInfo);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken },
      });
    });

    it('should extract token from headers when auth is not available', async () => {
      mockClient.handshake.auth = null;
      mockClient.handshake.headers = { token: mockToken };
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(mockAccountInfo);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken },
      });
    });

    it('should extract token from headers when auth.token is undefined', async () => {
      mockClient.handshake.auth = {};
      mockClient.handshake.headers = { token: mockToken };
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(mockAccountInfo);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken },
      });
    });

    it('should handle missing token gracefully', async () => {
      mockClient.handshake.auth = null;
      mockClient.handshake.headers = {};

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: undefined },
      });
    });
  });

  describe('authenticateClient', () => {
    it('should return account token for valid token', async () => {
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);

      const result = await guard.authenticateClient(mockToken);

      expect(result).toEqual(mockAccountToken);
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken },
      });
    });

    it('should return null for invalid token', async () => {
      mockPrisma.accountToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.authenticateClient('invalid-token');

      expect(result).toBeNull();
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: 'invalid-token' },
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.accountToken.findFirst = jest.fn().mockRejectedValue(dbError);

      await expect(guard.authenticateClient(mockToken)).rejects.toThrow(
        dbError,
      );
    });

    it('should handle empty token', async () => {
      mockPrisma.accountToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.authenticateClient('');

      expect(result).toBeNull();
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: '' },
      });
    });

    it('should handle null token', async () => {
      mockPrisma.accountToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.authenticateClient(null as any);

      expect(result).toBeNull();
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
        where: { token: null },
      });
    });
  });

  describe('fetchClientInformation', () => {
    const mockAccountData = {
      id: 'account-123',
      username: 'testuser',
      role: {
        id: 'role-123',
        name: 'Admin',
        roleGroup: {
          id: 'group-123',
          name: 'Admin Group',
        },
      },
    };

    it('should fetch account information with role data', async () => {
      mockPrisma.account.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountData);

      const result = await guard.fetchClientInformation(mockAccountToken);

      expect(result).toEqual(mockAccountData);
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountToken.accountId },
        include: {
          role: {
            include: {
              roleGroup: true,
            },
          },
        },
      });
    });

    it('should return null when account is not found', async () => {
      mockPrisma.account.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.fetchClientInformation(mockAccountToken);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database query failed');
      mockPrisma.account.findFirst = jest.fn().mockRejectedValue(dbError);

      await expect(
        guard.fetchClientInformation(mockAccountToken),
      ).rejects.toThrow(dbError);
    });

    it('should fetch account with correct includes', async () => {
      mockPrisma.account.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountData);

      await guard.fetchClientInformation(mockAccountToken);

      const expectedInclude = {
        role: {
          include: {
            roleGroup: true,
          },
        },
      };

      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: mockAccountToken.accountId },
        include: expectedInclude,
      });
    });
  });

  describe('error handling', () => {
    it('should handle prisma connection errors in canActivate', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.accountToken.findFirst = jest.fn().mockRejectedValue(dbError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(dbError);
    });

    it('should handle account service errors in canActivate', async () => {
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      const serviceError = new Error('Account service failed');
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockRejectedValue(serviceError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        serviceError,
      );
    });

    it('should handle context switching errors', async () => {
      mockContext.switchToWs.mockImplementation(() => {
        throw new Error('Context switch failed');
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Context switch failed',
      );
    });
  });

  describe('integration flow', () => {
    it('should complete full authentication flow successfully', async () => {
      mockPrisma.accountToken.findFirst = jest
        .fn()
        .mockResolvedValue(mockAccountToken);
      mockAccountService.getAccountInformation = jest
        .fn()
        .mockResolvedValue(mockAccountInfo);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);

      // Verify the complete flow
      expect(mockContext.switchToWs).toHaveBeenCalled();
      expect(mockPrisma.accountToken.findFirst).toHaveBeenCalled();
      expect(mockAccountService.getAccountInformation).toHaveBeenCalled();
      expect(mockUtilityService.setAccountInformation).toHaveBeenCalledWith(
        mockAccountInfo,
      );
    });

    it('should stop flow early when token authentication fails', async () => {
      mockPrisma.accountToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockAccountService.getAccountInformation).not.toHaveBeenCalled();
      expect(mockUtilityService.setAccountInformation).not.toHaveBeenCalled();
    });
  });
});
