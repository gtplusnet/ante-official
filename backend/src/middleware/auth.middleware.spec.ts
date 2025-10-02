import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from './auth.middleware';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AccountService } from '@modules/account/account/account.service';
import {
  createMockPrismaService,
  createMockUtilityService,
} from '../../test/setup';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockUtility: ReturnType<typeof createMockUtilityService>;
  let mockAccountService: Partial<AccountService>;

  const mockAccountData = {
    id: 'test-account-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    company: {
      id: 'test-company-id',
      companyName: 'Test Company',
    },
  };

  const mockAccountToken = {
    id: 'token-id',
    token: 'valid-token',
    accountId: 'test-account-id',
    status: 'active',
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockUtility = createMockUtilityService();

    mockAccountService = {
      getAccountInformation: jest.fn().mockResolvedValue(mockAccountData),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UtilityService, useValue: mockUtility },
        { provide: AccountService, useValue: mockAccountService },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockNext = jest.fn();
      mockResponse = {};
    });

    describe('route exclusions', () => {
      it('should skip auth for guardian routes in originalUrl', async () => {
        mockRequest = {
          originalUrl: '/api/guardian/auth/login',
          url: '/api/guardian/auth/login',
          path: '/api/guardian/auth/login',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should skip auth for guardian routes in path', async () => {
        mockRequest = {
          originalUrl: '/api/guardian/students',
          url: '/api/guardian/students',
          path: '/api/guardian/students',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should skip auth for health endpoints', async () => {
        mockRequest = {
          originalUrl: '/health',
          url: '/health',
          path: '/health',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should skip auth for health version endpoint', async () => {
        mockRequest = {
          originalUrl: '/health/version',
          url: '/health/version',
          path: '/health/version',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should skip auth for email approval endpoints', async () => {
        mockRequest = {
          originalUrl: '/email-approval/approve/token123',
          url: '/email-approval/approve/token123',
          path: '/email-approval/approve/token123',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should skip auth for api email approval endpoints', async () => {
        mockRequest = {
          originalUrl: '/api/email-approval/process/token456',
          url: '/api/email-approval/process/token456',
          path: '/api/email-approval/process/token456',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });

      it('should handle routes with query parameters', async () => {
        mockRequest = {
          originalUrl: '/health?check=true',
          url: '/health?check=true',
          path: '/health',
          headers: {},
        };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
        expect(mockPrisma.accountToken.findFirst).not.toHaveBeenCalled();
      });
    });

    describe('authentication required routes', () => {
      beforeEach(() => {
        mockRequest = {
          originalUrl: '/api/users',
          url: '/api/users',
          path: '/api/users',
          headers: {
            token: 'valid-token',
          },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);
      });

      it('should throw NotFoundException when token header is missing', async () => {
        mockRequest.headers = {};

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow(NotFoundException);

        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when token header is undefined', async () => {
        mockRequest.headers = { token: undefined };

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when token is not found in database', async () => {
        mockPrisma.accountToken.findFirst.mockResolvedValue(null);

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow(NotFoundException);

        expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
          where: { token: 'valid-token' },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when account is not found', async () => {
        mockAccountService.getAccountInformation = jest
          .fn()
          .mockResolvedValue(null);

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow(NotFoundException);

        expect(mockAccountService.getAccountInformation).toHaveBeenCalledWith({
          id: mockAccountToken.accountId,
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should successfully authenticate with valid token and account', async () => {
        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
          where: { token: 'valid-token' },
        });
        expect(mockAccountService.getAccountInformation).toHaveBeenCalledWith({
          id: mockAccountToken.accountId,
        });
        expect(mockUtility.setAccountInformation).toHaveBeenCalledWith(
          mockAccountData,
        );
        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle token as different types', async () => {
        // Test with number token
        mockRequest.headers = { token: 12345 as any };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
          where: { token: '12345' },
        });
      });

      it('should handle array token by converting to string', async () => {
        mockRequest.headers = { token: ['token1', 'token2'] as any };

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockPrisma.accountToken.findFirst).toHaveBeenCalledWith({
          where: { token: 'token1,token2' },
        });
      });
    });

    describe('edge cases', () => {
      it('should handle missing originalUrl and url', async () => {
        mockRequest = {
          path: '/api/users',
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle missing path and originalUrl', async () => {
        mockRequest = {
          url: '/api/users',
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle completely missing path information', async () => {
        mockRequest = {
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);

        await middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalled();
      });

      it('should handle database errors gracefully', async () => {
        mockRequest = {
          originalUrl: '/api/users',
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockRejectedValue(
          new Error('Database error'),
        );

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow('Database error');
      });

      it('should handle account service errors gracefully', async () => {
        mockRequest = {
          originalUrl: '/api/users',
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);
        mockAccountService.getAccountInformation = jest
          .fn()
          .mockRejectedValue(new Error('Account service error'));

        await expect(
          middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          ),
        ).rejects.toThrow('Account service error');
      });
    });

    describe('route pattern matching', () => {
      it('should require auth for regular API routes', async () => {
        const routesToTest = [
          '/api/users',
          '/api/projects',
          '/api/equipment',
          '/api/tasks',
          '/users/profile',
        ];

        for (const route of routesToTest) {
          mockRequest = {
            originalUrl: route,
            url: route,
            path: route,
            headers: {},
          };

          await expect(
            middleware.use(
              mockRequest as Request,
              mockResponse as Response,
              mockNext,
            ),
          ).rejects.toThrow(NotFoundException);
        }
      });

      it('should handle nested guardian routes correctly', async () => {
        const guardianRoutes = [
          '/api/guardian/auth/login',
          '/api/guardian/students/123',
          '/api/guardian/notifications',
        ];

        for (const route of guardianRoutes) {
          mockRequest = {
            originalUrl: route,
            url: route,
            path: route,
            headers: {},
          };

          await middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
          expect(mockNext).toHaveBeenCalled();

          // Reset mock for next iteration
          jest.clearAllMocks();
        }
      });

      it('should handle various health check patterns', async () => {
        const healthRoutes = [
          '/health',
          '/health/',
          '/health/check',
          '/health/version',
          '/health/status',
        ];

        for (const route of healthRoutes) {
          mockRequest = {
            originalUrl: route,
            url: route,
            path: route,
            headers: {},
          };

          await middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
          expect(mockNext).toHaveBeenCalled();

          // Reset mock for next iteration
          jest.clearAllMocks();
        }
      });
    });

    describe('security considerations', () => {
      it('should not expose token validation details in error', async () => {
        mockRequest = {
          originalUrl: '/api/users',
          headers: { token: 'invalid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(null);

        try {
          await middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('Invalid Token');
          // Should not expose details about token validation process
          expect(error.message).not.toContain('not found');
          expect(error.message).not.toContain('database');
        }
      });

      it('should not expose account details in error', async () => {
        mockRequest = {
          originalUrl: '/api/users',
          headers: { token: 'valid-token' },
        };
        mockPrisma.accountToken.findFirst.mockResolvedValue(mockAccountToken);
        mockAccountService.getAccountInformation = jest
          .fn()
          .mockResolvedValue(null);

        try {
          await middleware.use(
            mockRequest as Request,
            mockResponse as Response,
            mockNext,
          );
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('Invalid Account');
          // Should not expose account ID or other sensitive info
          expect(error.message).not.toContain(mockAccountToken.accountId);
        }
      });

      it('should handle malformed tokens gracefully', async () => {
        const malformedTokens = [
          null,
          undefined,
          '',
          '   ',
          'malformed-token-with-special-chars!@#$%',
          'very'.repeat(100) + 'long-token',
        ];

        for (const token of malformedTokens) {
          mockRequest = {
            originalUrl: '/api/users',
            headers: { token },
          };

          if (!token || !token.toString().trim()) {
            await expect(
              middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
              ),
            ).rejects.toThrow(NotFoundException);
          } else {
            mockPrisma.accountToken.findFirst.mockResolvedValue(null);
            await expect(
              middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
              ),
            ).rejects.toThrow(NotFoundException);
          }
        }
      });
    });
  });
});
