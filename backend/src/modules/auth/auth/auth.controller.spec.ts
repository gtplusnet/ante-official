import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BusinessType, Industry } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { InviteService } from './invite.service';
import { UtilityService } from '@common/utility.service';
import {
  createMockUtilityService,
  createMockResponse,
  mockHeaders,
  mockIpAddress,
} from '../../../../test/setup';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockEmailVerificationService: Partial<EmailVerificationService>;
  let mockInviteService: Partial<InviteService>;
  let mockUtility: ReturnType<typeof createMockUtilityService>;

  const mockLoginResponse = {
    token: 'test-token',
    accountInformation: {
      id: 'test-account-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
    serverName: 'TEST',
  };

  const mockSignUpResponse = {
    token: 'test-token',
    accountInformation: {
      id: 'test-account-id',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    serverName: 'TEST',
  };

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn().mockResolvedValue(mockLoginResponse),
      signUp: jest.fn().mockResolvedValue(mockSignUpResponse),
      loginWithGoogle: jest.fn().mockResolvedValue(mockLoginResponse),
      loginWithFacebook: jest.fn().mockResolvedValue(mockLoginResponse),
    };

    mockEmailVerificationService = {
      verifyEmail: jest.fn().mockResolvedValue({ success: true }),
      resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockInviteService = {
      sendInvite: jest.fn().mockResolvedValue({ success: true }),
      acceptInvite: jest
        .fn()
        .mockResolvedValue(mockLoginResponse.accountInformation),
      acceptInviteWithGoogle: jest
        .fn()
        .mockResolvedValue(mockLoginResponse.accountInformation),
      acceptInviteWithFacebook: jest
        .fn()
        .mockResolvedValue(mockLoginResponse.accountInformation),
      resendInvite: jest.fn().mockResolvedValue({ success: true }),
      cancelInvite: jest.fn().mockResolvedValue({ success: true }),
      verifyInviteToken: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { id: 'role-id', name: 'Test Role' },
        company: { id: 'company-id', companyName: 'Test Company' },
      }),
    };

    mockUtility = createMockUtilityService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        { provide: InviteService, useValue: mockInviteService },
        { provide: UtilityService, useValue: mockUtility },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      username: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login and return response', async () => {
      const mockResponse = createMockResponse();

      await controller.login(
        mockResponse,
        loginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResponse);
    });

    it('should handle login with username instead of email', async () => {
      const usernameLoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const mockResponse = createMockResponse();

      await controller.login(
        mockResponse,
        usernameLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        usernameLoginDto,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should propagate authentication errors', async () => {
      const authError = new Error('Invalid credentials');
      mockAuthService.login = jest.fn().mockRejectedValue(authError);
      const mockResponse = createMockResponse();

      await expect(
        controller.login(mockResponse, loginDto, mockHeaders, mockIpAddress),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signup', () => {
    const signUpDto = {
      companyInformation: {
        companyName: 'Test Company',
        domainPrefix: 'testcompany',
        businessType: BusinessType.OTHERS,
        industry: Industry.SERVICES,
      },
      accountInformation: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@testcompany.com',
        username: 'johndoe',
        password: 'password123',
        contactNumber: '+1234567890',
      },
      sourceUrl: 'https://example.com',
    };

    it('should successfully sign up and return response', async () => {
      const mockResponse = createMockResponse();

      await controller.signup(
        mockResponse,
        signUpDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.signUp).toHaveBeenCalledWith(
        signUpDto,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSignUpResponse);
    });

    it('should handle signup errors', async () => {
      const signupError = new Error('Company already exists');
      mockAuthService.signUp = jest.fn().mockRejectedValue(signupError);
      const mockResponse = createMockResponse();

      await expect(
        controller.signup(mockResponse, signUpDto, mockHeaders, mockIpAddress),
      ).rejects.toThrow('Company already exists');
    });
  });

  describe('loginWithGoogle', () => {
    const googleLoginDto = {
      googleIdToken: 'google-id-token-123',
    };

    it('should successfully login with Google and return response', async () => {
      const mockResponse = createMockResponse();

      await controller.loginWithGoogle(
        mockResponse,
        googleLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith(
        googleLoginDto.googleIdToken,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResponse);
    });

    it('should handle Google login errors gracefully', async () => {
      const googleError = new Error('Invalid Google token');
      mockAuthService.loginWithGoogle = jest
        .fn()
        .mockRejectedValue(googleError);
      const mockResponse = createMockResponse();

      await controller.loginWithGoogle(
        mockResponse,
        googleLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        googleError,
        'Google login failed',
      );
    });

    it('should handle Google service errors', async () => {
      const serviceError = new Error('Google service unavailable');
      mockAuthService.loginWithGoogle = jest
        .fn()
        .mockRejectedValue(serviceError);
      const mockResponse = createMockResponse();

      await controller.loginWithGoogle(
        mockResponse,
        googleLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        serviceError,
        'Google login failed',
      );
    });
  });

  describe('loginWithFacebook', () => {
    const facebookLoginDto = {
      facebookAccessToken: 'facebook-access-token-123',
    };

    it('should successfully login with Facebook and return response', async () => {
      const mockResponse = createMockResponse();

      await controller.loginWithFacebook(
        mockResponse,
        facebookLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.loginWithFacebook).toHaveBeenCalledWith(
        facebookLoginDto.facebookAccessToken,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResponse);
    });

    it('should handle Facebook login errors gracefully', async () => {
      const facebookError = new Error('Invalid Facebook token');
      mockAuthService.loginWithFacebook = jest
        .fn()
        .mockRejectedValue(facebookError);
      const mockResponse = createMockResponse();

      await controller.loginWithFacebook(
        mockResponse,
        facebookLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        facebookError,
        'Facebook login failed',
      );
    });

    it('should handle Facebook service errors', async () => {
      const serviceError = new Error('Facebook service unavailable');
      mockAuthService.loginWithFacebook = jest
        .fn()
        .mockRejectedValue(serviceError);
      const mockResponse = createMockResponse();

      await controller.loginWithFacebook(
        mockResponse,
        facebookLoginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        serviceError,
        'Facebook login failed',
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockResponse = createMockResponse();
      const token = 'email-verification-token';

      await controller.verifyEmail(mockResponse, token);

      expect(mockEmailVerificationService.verifyEmail).toHaveBeenCalledWith(
        token,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email verified successfully',
        accountInformation: { success: true },
      });
    });

    it('should handle invalid email verification token', async () => {
      const verificationError = new Error('Invalid token');
      mockEmailVerificationService.verifyEmail = jest
        .fn()
        .mockRejectedValue(verificationError);
      const mockResponse = createMockResponse();
      const token = 'invalid-token';

      await controller.verifyEmail(mockResponse, token);

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        verificationError,
        'Email verification failed',
      );
    });

    it('should handle expired email verification token', async () => {
      const expiredError = new Error('Token expired');
      mockEmailVerificationService.verifyEmail = jest
        .fn()
        .mockRejectedValue(expiredError);
      const mockResponse = createMockResponse();
      const token = 'expired-token';

      await controller.verifyEmail(mockResponse, token);

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        expiredError,
        'Email verification failed',
      );
    });
  });

  describe('invite management', () => {
    describe('sendInvite', () => {
      const sendInviteDto = {
        email: 'newuser@company.com',
        firstName: 'John',
        lastName: 'Doe',
        roleID: 'role-id',
        parentAccountId: null,
      };

      it('should send invite successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.sendInvite(mockResponse, sendInviteDto);

        expect(mockInviteService.sendInvite).toHaveBeenCalledWith(
          {
            email: sendInviteDto.email,
            firstName: sendInviteDto.firstName,
            lastName: sendInviteDto.lastName,
            roleId: sendInviteDto.roleID,
            parentAccountId: sendInviteDto.parentAccountId,
          },
          mockUtility.accountInformation.id,
          mockUtility.companyId,
        );
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation sent successfully',
          invite: { success: true },
        });
      });

      it('should handle duplicate invite errors', async () => {
        const duplicateError = new Error('User already invited');
        mockInviteService.sendInvite = jest
          .fn()
          .mockRejectedValue(duplicateError);
        const mockResponse = createMockResponse();

        await controller.sendInvite(mockResponse, sendInviteDto);

        expect(mockUtility.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          duplicateError,
          'Failed to send invitation',
        );
      });
    });

    describe('acceptInvite', () => {
      const acceptInviteDto = {
        token: 'invite-token',
        username: 'janesmith',
        password: 'password123',
        contactNumber: '+1234567890',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
      };

      it('should accept invite successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.acceptInvite(
          mockResponse,
          acceptInviteDto,
          mockHeaders,
          mockIpAddress,
        );

        expect(mockInviteService.acceptInvite).toHaveBeenCalledWith({
          token: acceptInviteDto.token,
          username: acceptInviteDto.username,
          password: acceptInviteDto.password,
          contactNumber: acceptInviteDto.contactNumber,
          dateOfBirth: new Date(acceptInviteDto.dateOfBirth),
        });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation accepted successfully',
          ...mockLoginResponse,
        });
      });

      it('should handle invalid invite token', async () => {
        const invalidTokenError = new Error('Invalid invite token');
        mockInviteService.acceptInvite = jest
          .fn()
          .mockRejectedValue(invalidTokenError);
        const mockResponse = createMockResponse();

        await controller.acceptInvite(
          mockResponse,
          acceptInviteDto,
          mockHeaders,
          mockIpAddress,
        );

        expect(mockUtility.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          invalidTokenError,
          'Failed to accept invitation',
        );
      });
    });

    describe('acceptInviteWithGoogle', () => {
      const acceptInviteGoogleDto = {
        token: 'invite-token',
        googleIdToken: 'google-id-token',
      };

      it('should accept invite with Google successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.acceptInviteWithGoogle(
          mockResponse,
          acceptInviteGoogleDto,
          mockHeaders,
          mockIpAddress,
        );

        expect(mockInviteService.acceptInviteWithGoogle).toHaveBeenCalledWith({
          token: acceptInviteGoogleDto.token,
          googleIdToken: acceptInviteGoogleDto.googleIdToken,
          contactNumber: undefined,
          dateOfBirth: undefined,
        });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation accepted successfully with Google',
          ...mockLoginResponse,
        });
      });
    });

    describe('acceptInviteWithFacebook', () => {
      const acceptInviteFacebookDto = {
        token: 'invite-token',
        facebookAccessToken: 'facebook-access-token',
      };

      it('should accept invite with Facebook successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.acceptInviteWithFacebook(
          mockResponse,
          acceptInviteFacebookDto,
          mockHeaders,
          mockIpAddress,
        );

        expect(mockInviteService.acceptInviteWithFacebook).toHaveBeenCalledWith(
          {
            token: acceptInviteFacebookDto.token,
            facebookAccessToken: acceptInviteFacebookDto.facebookAccessToken,
            contactNumber: undefined,
            dateOfBirth: undefined,
          },
        );
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation accepted successfully with Facebook',
          ...mockLoginResponse,
        });
      });
    });

    describe('resendInvite', () => {
      const resendInviteDto = {
        inviteId: 'invite-id-123',
      };

      it('should resend invite successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.resendInvite(mockResponse, resendInviteDto);

        expect(mockInviteService.resendInvite).toHaveBeenCalledWith(
          resendInviteDto.inviteId,
        );
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation resent successfully',
        });
      });
    });

    describe('cancelInvite', () => {
      const inviteId = 'invite-id-to-cancel';

      it('should cancel invite successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.cancelInvite(mockResponse, inviteId);

        expect(mockInviteService.cancelInvite).toHaveBeenCalledWith(inviteId);
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Invitation cancelled successfully',
        });
      });
    });

    describe('verifyInviteToken', () => {
      const verifyTokenDto = {
        token: 'invite-token',
      };

      it('should verify invite token successfully', async () => {
        const mockResponse = createMockResponse();

        await controller.verifyInviteToken(mockResponse, verifyTokenDto);

        expect(mockInviteService.verifyInviteToken).toHaveBeenCalledWith(
          verifyTokenDto.token,
        );
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          valid: true,
          invite: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: { id: 'role-id', name: 'Test Role' },
            company: { id: 'company-id', companyName: 'Test Company' },
          },
        });
      });

      it('should handle invalid invite token verification', async () => {
        const invalidError = new Error('Token is invalid or expired');
        mockInviteService.verifyInviteToken = jest
          .fn()
          .mockRejectedValue(invalidError);
        const mockResponse = createMockResponse();

        await controller.verifyInviteToken(mockResponse, verifyTokenDto);

        expect(mockUtility.errorResponse).toHaveBeenCalledWith(
          mockResponse,
          invalidError,
          'Invalid invitation token',
        );
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle service unavailability gracefully', async () => {
      const serviceError = new Error('Service temporarily unavailable');
      mockAuthService.login = jest.fn().mockRejectedValue(serviceError);
      const mockResponse = createMockResponse();
      const loginDto = { username: 'test@example.com', password: 'password' };

      await expect(
        controller.login(mockResponse, loginDto, mockHeaders, mockIpAddress),
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle missing headers gracefully', async () => {
      const mockResponse = createMockResponse();
      const loginDto = { username: 'test@example.com', password: 'password' };
      const emptyHeaders = {};

      await controller.login(
        mockResponse,
        loginDto,
        emptyHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        emptyHeaders,
        mockIpAddress,
      );
    });

    it('should handle missing IP address gracefully', async () => {
      const mockResponse = createMockResponse();
      const loginDto = { username: 'test@example.com', password: 'password' };

      await controller.login(mockResponse, loginDto, mockHeaders, undefined);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockHeaders,
        undefined,
      );
    });

    it('should handle malformed request bodies', async () => {
      const mockResponse = createMockResponse();
      const malformedDto = {}; // Empty/invalid DTO

      // This would typically be caught by validation decorators
      await controller.login(
        mockResponse,
        malformedDto as any,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        malformedDto,
        mockHeaders,
        mockIpAddress,
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle successful authentication flow', async () => {
      const mockResponse = createMockResponse();
      const loginDto = {
        username: 'test@example.com',
        password: 'password123',
      };

      await controller.login(
        mockResponse,
        loginDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockHeaders,
        mockIpAddress,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResponse);
    });

    it('should handle OAuth flow with fallback to regular login', async () => {
      // First try Google login
      const mockResponse = createMockResponse();
      const googleDto = { googleIdToken: 'invalid-token' };

      const googleError = new Error('Google token expired');
      mockAuthService.loginWithGoogle = jest
        .fn()
        .mockRejectedValue(googleError);

      await controller.loginWithGoogle(
        mockResponse,
        googleDto,
        mockHeaders,
        mockIpAddress,
      );

      expect(mockUtility.errorResponse).toHaveBeenCalledWith(
        mockResponse,
        googleError,
        'Google login failed',
      );
    });
  });
});
