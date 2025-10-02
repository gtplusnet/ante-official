import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@common/prisma.service';
import { EncryptionService } from '@common/encryption.service';
import { UtilityService } from '@common/utility.service';
import { RoleService } from '@modules/role/role/role.service';
import { ScopeService } from '../../project/scope/scope/scope.service';
import { AccountService } from '@modules/account/account/account.service';
import { CompanyService } from '../../company/company/company.service';
import { EmailVerificationService } from './email-verification.service';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthProvider, BusinessType, Industry } from '@prisma/client';
import {
  createMockPrismaService,
  createMockUtilityService,
  createMockEncryptionService,
} from '../../../../test/setup';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockCrypt: ReturnType<typeof createMockEncryptionService>;
  let mockUtility: ReturnType<typeof createMockUtilityService>;
  let mockRoleService: Partial<RoleService>;
  let mockScopeService: Partial<ScopeService>;
  let mockAccountService: Partial<AccountService>;
  let mockCompanyService: Partial<CompanyService>;
  let mockEmailVerificationService: Partial<EmailVerificationService>;
  let mockGoogleAuthService: Partial<GoogleAuthService>;
  let mockFacebookAuthService: Partial<FacebookAuthService>;

  const mockHeaders = new Headers();
  mockHeaders.set('user-agent', 'test-user-agent');
  const mockIpAddress = '127.0.0.1';

  const mockAccount = {
    id: 'test-account-id',
    email: 'test@example.com',
    username: 'testuser',
    password: 'encrypted-password',
    key: 'encryption-key',
    authProvider: AuthProvider.LOCAL,
    company: {
      id: 'test-company-id',
      companyName: 'Test Company',
      isActive: true,
    },
  };

  const mockAccountResponse = {
    id: 'test-account-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockRoleResponse = {
    id: 'test-role-id',
    roleName: 'Developer',
  };

  const mockCompanyResponse = {
    id: 'test-company-id',
    companyName: 'Test Company',
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockCrypt = createMockEncryptionService();
    mockUtility = createMockUtilityService();

    mockRoleService = {
      getDeveloperRole: jest.fn().mockResolvedValue(mockRoleResponse),
    };

    mockScopeService = {};

    mockAccountService = {
      getAccountInformation: jest.fn().mockResolvedValue(mockAccountResponse),
      createAccount: jest.fn() as jest.MockedFunction<any>,
    };
    (
      mockAccountService.createAccount as jest.MockedFunction<any>
    ).mockResolvedValue(mockAccountResponse);

    mockCompanyService = {
      createCompany: jest.fn().mockResolvedValue(mockCompanyResponse),
    };

    mockEmailVerificationService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockGoogleAuthService = {
      verifyGoogleToken: jest.fn(),
      findAccountByGoogleId: jest.fn(),
      findAccountByGoogleEmail: jest.fn(),
      findAccountByEmail: jest.fn(),
    };

    mockFacebookAuthService = {
      verifyFacebookToken: jest.fn(),
      findAccountByFacebookId: jest.fn(),
      findAccountByFacebookEmail: jest.fn(),
      findAccountByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockCrypt },
        { provide: UtilityService, useValue: mockUtility },
        { provide: RoleService, useValue: mockRoleService },
        { provide: ScopeService, useValue: mockScopeService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: CompanyService, useValue: mockCompanyService },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
        { provide: FacebookAuthService, useValue: mockFacebookAuthService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginParams = {
      username: 'test@example.com',
      password: 'plainpassword',
    };

    beforeEach(() => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount);
      mockPrisma.accountToken.create.mockResolvedValue({ token: 'mock-token' });
      mockCrypt.decrypt.mockResolvedValue('plainpassword');
    });

    it('should successfully login with valid credentials', async () => {
      const result = await service.login(
        loginParams,
        mockHeaders,
        mockIpAddress,
      );

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('accountInformation');
      expect(result).toHaveProperty('serverName');
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: loginParams.username },
            { username: loginParams.username },
          ],
        },
        include: { company: true },
      });
      expect(mockCrypt.decrypt).toHaveBeenCalledWith(
        'encrypted-password',
        'encryption-key',
      );
      expect(mockUtility.log).toHaveBeenCalled();
    });

    it('should login with username instead of email', async () => {
      const usernameLogin = { username: 'testuser', password: 'plainpassword' };

      await service.login(usernameLogin, mockHeaders, mockIpAddress);

      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: usernameLogin.username },
            { username: usernameLogin.username },
          ],
        },
        include: { company: true },
      });
    });

    it('should throw NotFoundException for invalid account', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.account.findFirst).toHaveBeenCalled();
    });

    it('should throw BadRequestException for deactivated company', async () => {
      const inactiveAccount = {
        ...mockAccount,
        company: { ...mockAccount.company, isActive: false },
      };
      mockPrisma.account.findFirst.mockResolvedValue(inactiveAccount);

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for account without password', async () => {
      const accountWithoutPassword = {
        ...mockAccount,
        password: null,
        key: null,
      };
      mockPrisma.account.findFirst.mockResolvedValue(accountWithoutPassword);

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle Google OAuth account without password', async () => {
      const googleAccount = {
        ...mockAccount,
        password: null,
        key: null,
        authProvider: AuthProvider.GOOGLE,
      };
      mockPrisma.account.findFirst.mockResolvedValue(googleAccount);

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow('This account uses Google Sign-In');
    });

    it('should handle Facebook OAuth account without password', async () => {
      const facebookAccount = {
        ...mockAccount,
        password: null,
        key: null,
        authProvider: AuthProvider.FACEBOOK,
      };
      mockPrisma.account.findFirst.mockResolvedValue(facebookAccount);

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow('This account uses Facebook Sign-In');
    });

    it('should throw NotFoundException for invalid password', async () => {
      mockCrypt.decrypt.mockResolvedValue('differentpassword');

      await expect(
        service.login(loginParams, mockHeaders, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('signUp', () => {
    const signUpParams = {
      companyInformation: {
        companyName: 'New Company',
        domainPrefix: 'newcompany',
        businessType: BusinessType.OTHERS,
        industry: Industry.OTHERS,
        registrationNo: '12345',
        phone: '+1234567890',
        tinNo: 'TIN123',
      },
      accountInformation: {
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '+1234567890',
        email: 'john@newcompany.com',
        username: 'johndoe',
        password: 'password123',
      },
      sourceUrl: 'https://example.com',
    };

    beforeEach(() => {
      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);
      mockPrisma.accountToken.create.mockResolvedValue({ token: 'mock-token' });
    });

    it('should successfully sign up new user', async () => {
      const result = await service.signUp(
        signUpParams,
        mockHeaders,
        mockIpAddress,
      );

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('accountInformation');
      expect(result).toHaveProperty('serverName');
      expect(mockCompanyService.createCompany).toHaveBeenCalledWith({
        companyName: signUpParams.companyInformation.companyName,
        domainPrefix: signUpParams.companyInformation.domainPrefix,
        businessType: signUpParams.companyInformation.businessType,
        industry: signUpParams.companyInformation.industry,
        registrationNo: signUpParams.companyInformation.registrationNo,
        phone: signUpParams.companyInformation.phone,
        tinNo: signUpParams.companyInformation.tinNo,
      });
      expect(mockRoleService.getDeveloperRole).toHaveBeenCalled();
      expect(mockAccountService.createAccount).toHaveBeenCalled();
      expect(
        mockEmailVerificationService.sendVerificationEmail,
      ).toHaveBeenCalled();
    });

    it('should handle missing optional company information', async () => {
      const minimalSignUp = {
        ...signUpParams,
        companyInformation: {
          ...signUpParams.companyInformation,
          registrationNo: undefined,
          phone: undefined,
          tinNo: undefined,
        },
      };

      await service.signUp(minimalSignUp, mockHeaders, mockIpAddress);

      expect(mockCompanyService.createCompany).toHaveBeenCalledWith({
        companyName: minimalSignUp.companyInformation.companyName,
        domainPrefix: minimalSignUp.companyInformation.domainPrefix,
        businessType: minimalSignUp.companyInformation.businessType,
        industry: minimalSignUp.companyInformation.industry,
        registrationNo: '',
        phone: '',
        tinNo: '',
      });
    });

    it('should create account with correct parameters', async () => {
      await service.signUp(signUpParams, mockHeaders, mockIpAddress);

      expect(mockAccountService.createAccount).toHaveBeenCalledWith({
        firstName: signUpParams.accountInformation.firstName,
        lastName: signUpParams.accountInformation.lastName,
        middleName: '',
        contactNumber: signUpParams.accountInformation.contactNumber,
        email: signUpParams.accountInformation.email,
        username: signUpParams.accountInformation.username,
        password: signUpParams.accountInformation.password,
        roleID: mockRoleResponse.id,
        companyId: mockCompanyResponse.id,
        sourceUrl: signUpParams.sourceUrl,
      });
    });
  });

  describe('loginWithGoogle', () => {
    const mockGoogleUser = {
      sub: 'google-user-id',
      email: 'test@example.com',
    };

    beforeEach(() => {
      (mockGoogleAuthService.verifyGoogleToken as jest.Mock).mockResolvedValue(
        mockGoogleUser,
      );
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(mockAccount);
      mockPrisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        company: mockAccount.company,
      });
      mockPrisma.account.update.mockResolvedValue(mockAccount);
      mockPrisma.accountToken.create.mockResolvedValue({ token: 'mock-token' });
    });

    it('should successfully login with Google token', async () => {
      const result = await service.loginWithGoogle(
        'google-id-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('accountInformation');
      expect(mockGoogleAuthService.verifyGoogleToken).toHaveBeenCalledWith(
        'google-id-token',
      );
      expect(mockGoogleAuthService.findAccountByGoogleId).toHaveBeenCalledWith(
        mockGoogleUser.sub,
      );
      expect(mockUtility.log).toHaveBeenCalledWith(
        `${mockAccountResponse.email} has successfully logged in via Google.`,
      );
    });

    it('should find account by Google email if not found by ID', async () => {
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockGoogleAuthService.findAccountByGoogleEmail as jest.Mock
      ).mockResolvedValue(mockAccount);

      await service.loginWithGoogle(
        'google-id-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(
        mockGoogleAuthService.findAccountByGoogleEmail,
      ).toHaveBeenCalledWith(mockGoogleUser.email);
    });

    it('should find account by regular email if not found by Google email', async () => {
      const googleAccount = {
        ...mockAccount,
        authProvider: AuthProvider.GOOGLE,
      };
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockGoogleAuthService.findAccountByGoogleEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockGoogleAuthService.findAccountByEmail as jest.Mock).mockResolvedValue(
        googleAccount,
      );

      await service.loginWithGoogle(
        'google-id-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(mockGoogleAuthService.findAccountByEmail).toHaveBeenCalledWith(
        mockGoogleUser.email,
      );
    });

    it('should throw BadRequestException for existing LOCAL account', async () => {
      const localAccount = { ...mockAccount, authProvider: AuthProvider.LOCAL };
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockGoogleAuthService.findAccountByGoogleEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockGoogleAuthService.findAccountByEmail as jest.Mock).mockResolvedValue(
        localAccount,
      );

      await expect(
        service.loginWithGoogle('google-id-token', mockHeaders, mockIpAddress),
      ).rejects.toThrow('This email is already registered with a password');
    });

    it('should throw BadRequestException for existing FACEBOOK account', async () => {
      const facebookAccount = {
        ...mockAccount,
        authProvider: AuthProvider.FACEBOOK,
      };
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockGoogleAuthService.findAccountByGoogleEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockGoogleAuthService.findAccountByEmail as jest.Mock).mockResolvedValue(
        facebookAccount,
      );

      await expect(
        service.loginWithGoogle('google-id-token', mockHeaders, mockIpAddress),
      ).rejects.toThrow('This email is already linked to a Facebook account');
    });

    it('should throw NotFoundException for non-existing account', async () => {
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockGoogleAuthService.findAccountByGoogleEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockGoogleAuthService.findAccountByEmail as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.loginWithGoogle('google-id-token', mockHeaders, mockIpAddress),
      ).rejects.toThrow('No account found with this Google email');
    });

    it('should throw BadRequestException for deactivated company', async () => {
      const accountWithInactiveCompany = {
        ...mockAccount,
        company: { ...mockAccount.company, isActive: false },
      };
      mockPrisma.account.findUnique.mockResolvedValue(
        accountWithInactiveCompany,
      );

      await expect(
        service.loginWithGoogle('google-id-token', mockHeaders, mockIpAddress),
      ).rejects.toThrow('Your company account has been deactivated');
    });

    it('should update account with Google ID and email if not set', async () => {
      const accountWithoutGoogleData = {
        ...mockAccount,
        googleId: null,
        googleEmail: null,
      };
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(accountWithoutGoogleData);

      await service.loginWithGoogle(
        'google-id-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: mockAccount.id },
        data: {
          lastLogin: expect.any(Date),
          googleId: mockGoogleUser.sub,
          googleEmail: mockGoogleUser.email,
        },
      });
    });

    it('should not update Google data if already set', async () => {
      const accountWithGoogleData = {
        ...mockAccount,
        googleId: 'existing-google-id',
        googleEmail: 'existing@google.com',
      };
      (
        mockGoogleAuthService.findAccountByGoogleId as jest.Mock
      ).mockResolvedValue(accountWithGoogleData);

      await service.loginWithGoogle(
        'google-id-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: mockAccount.id },
        data: {
          lastLogin: expect.any(Date),
        },
      });
    });
  });

  describe('loginWithFacebook', () => {
    const mockFacebookUser = {
      id: 'facebook-user-id',
      email: 'test@example.com',
    };

    beforeEach(() => {
      (
        mockFacebookAuthService.verifyFacebookToken as jest.Mock
      ).mockResolvedValue(mockFacebookUser);
      (
        mockFacebookAuthService.findAccountByFacebookId as jest.Mock
      ).mockResolvedValue(mockAccount);
      mockPrisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        company: mockAccount.company,
      });
      mockPrisma.account.update.mockResolvedValue(mockAccount);
      mockPrisma.accountToken.create.mockResolvedValue({ token: 'mock-token' });
    });

    it('should successfully login with Facebook token', async () => {
      const result = await service.loginWithFacebook(
        'facebook-access-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('accountInformation');
      expect(mockFacebookAuthService.verifyFacebookToken).toHaveBeenCalledWith(
        'facebook-access-token',
      );
      expect(
        mockFacebookAuthService.findAccountByFacebookId,
      ).toHaveBeenCalledWith(mockFacebookUser.id);
      expect(mockUtility.log).toHaveBeenCalledWith(
        `${mockAccountResponse.email} has successfully logged in via Facebook.`,
      );
    });

    it('should find account by Facebook email if not found by ID', async () => {
      (
        mockFacebookAuthService.findAccountByFacebookId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockFacebookAuthService.findAccountByFacebookEmail as jest.Mock
      ).mockResolvedValue(mockAccount);

      await service.loginWithFacebook(
        'facebook-access-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(
        mockFacebookAuthService.findAccountByFacebookEmail,
      ).toHaveBeenCalledWith(mockFacebookUser.email);
    });

    it('should throw BadRequestException for existing LOCAL account', async () => {
      const localAccount = { ...mockAccount, authProvider: AuthProvider.LOCAL };
      (
        mockFacebookAuthService.findAccountByFacebookId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockFacebookAuthService.findAccountByFacebookEmail as jest.Mock
      ).mockResolvedValue(null);
      (
        mockFacebookAuthService.findAccountByEmail as jest.Mock
      ).mockResolvedValue(localAccount);

      await expect(
        service.loginWithFacebook(
          'facebook-access-token',
          mockHeaders,
          mockIpAddress,
        ),
      ).rejects.toThrow('This email is already registered with a password');
    });

    it('should throw BadRequestException for existing GOOGLE account', async () => {
      const googleAccount = {
        ...mockAccount,
        authProvider: AuthProvider.GOOGLE,
      };
      (
        mockFacebookAuthService.findAccountByFacebookId as jest.Mock
      ).mockResolvedValue(null);
      (
        mockFacebookAuthService.findAccountByFacebookEmail as jest.Mock
      ).mockResolvedValue(null);
      (
        mockFacebookAuthService.findAccountByEmail as jest.Mock
      ).mockResolvedValue(googleAccount);

      await expect(
        service.loginWithFacebook(
          'facebook-access-token',
          mockHeaders,
          mockIpAddress,
        ),
      ).rejects.toThrow('This email is already linked to a Google account');
    });

    it('should update account with Facebook ID and email if not set', async () => {
      const accountWithoutFacebookData = {
        ...mockAccount,
        facebookId: null,
        facebookEmail: null,
      };
      (
        mockFacebookAuthService.findAccountByFacebookId as jest.Mock
      ).mockResolvedValue(accountWithoutFacebookData);

      await service.loginWithFacebook(
        'facebook-access-token',
        mockHeaders,
        mockIpAddress,
      );

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: mockAccount.id },
        data: {
          lastLogin: expect.any(Date),
          facebookId: mockFacebookUser.id,
          facebookEmail: mockFacebookUser.email,
        },
      });
    });
  });

  describe('generateToken', () => {
    beforeEach(() => {
      mockPrisma.accountToken.create.mockResolvedValue({
        token: 'created-token',
      });
    });

    it('should generate and save a token', async () => {
      const result = await service.generateToken(
        mockAccount as any,
        mockHeaders,
        mockIpAddress,
      );

      expect(result).toBe('mock-random-string');
      expect(mockUtility.randomString).toHaveBeenCalled();
      expect(mockPrisma.accountToken.create).toHaveBeenCalledWith({
        data: {
          account: { connect: { id: mockAccount.id } },
          payload: Buffer.from(JSON.stringify(mockAccount)).toString('base64'),
          userAgent: mockHeaders['user-agent'],
          ipAddress: mockIpAddress,
          token: 'mock-random-string',
          status: 'active',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle missing user agent', async () => {
      const headersWithoutUserAgent = { ...mockHeaders };
      delete headersWithoutUserAgent['user-agent'];

      await service.generateToken(
        mockAccount as any,
        headersWithoutUserAgent,
        mockIpAddress,
      );

      expect(mockPrisma.accountToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: undefined,
        }),
      });
    });

    it('should create correct payload', async () => {
      await service.generateToken(
        mockAccount as any,
        mockHeaders,
        mockIpAddress,
      );

      const expectedPayload = Buffer.from(JSON.stringify(mockAccount)).toString(
        'base64',
      );
      expect(mockPrisma.accountToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expectedPayload,
        }),
      });
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.account.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.login(
          { username: 'test', password: 'test' },
          mockHeaders,
          mockIpAddress,
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle encryption service errors', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(mockAccount);
      mockCrypt.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(
        service.login(
          { username: 'test', password: 'test' },
          mockHeaders,
          mockIpAddress,
        ),
      ).rejects.toThrow('Decryption failed');
    });

    it('should handle account service errors during signup', async () => {
      (
        mockAccountService.createAccount as jest.MockedFunction<any>
      ).mockRejectedValue(new Error('Account creation failed'));

      await expect(
        service.signUp(
          {
            companyInformation: {
              companyName: 'Test',
              domainPrefix: 'test',
              businessType: BusinessType.OTHERS,
              industry: Industry.OTHERS,
            },
            accountInformation: {
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
              username: 'testuser',
              password: 'password',
              contactNumber: '123',
            },
            sourceUrl: 'test',
          },
          mockHeaders,
          mockIpAddress,
        ),
      ).rejects.toThrow('Account creation failed');
    });
  });
});
