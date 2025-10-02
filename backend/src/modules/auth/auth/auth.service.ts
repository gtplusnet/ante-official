import {
  Injectable,
  Inject,
  NotFoundException,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  Account,
  Prisma,
  BusinessType,
  Industry,
  AuthProvider,
} from '@prisma/client';
import { EncryptionService } from '@common/encryption.service';
import { UtilityService } from '@common/utility.service';
import * as bcrypt from 'bcrypt';
import { RoleService } from '@modules/role/role/role.service';
import { ScopeService } from '../../project/scope/scope/scope.service';
import { AccountDataResponse } from '../../../shared/response/account.response';
import { LoginResponse } from '../../../shared/response/auth.response';
import { AccountService } from '@modules/account/account/account.service';
import { SignUpRequest } from '../../../shared/request/auth.request';
import { CompanyService } from '../../company/company/company.service';
import {
  CompanyDataResponse,
  RoleDataResponse,
} from '../../../shared/response';
import { AccountCreateDTO } from '@modules/account/account/account.validator';
import { EmailVerificationService } from './email-verification.service';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import {
  RedisService,
  CachedTokenData,
} from '@infrastructure/redis/redis.service';
import { SupabaseAuthService } from '../supabase-auth/supabase-auth.service';

@Injectable()
export class AuthService {
  @Inject() private prisma: PrismaService;
  @Inject() private crypt: EncryptionService;
  @Inject() private utility: UtilityService;
  @Inject() private roleService: RoleService;
  @Inject() private scopeService: ScopeService;
  @Inject() private accountService: AccountService;
  @Inject() private companyService: CompanyService;
  @Inject() private emailVerificationService: EmailVerificationService;
  @Inject() private googleAuthService: GoogleAuthService;
  @Inject() private facebookAuthService: FacebookAuthService;
  @Inject() private redisService: RedisService;
  @Inject() private supabaseAuthService: SupabaseAuthService;

  async login(
    { username, password },
    headers: Headers,
    ip: string,
  ): Promise<LoginResponse> {
    const account = await this.prisma.account.findFirst({
      where: { OR: [{ email: username }, { username }] },
      include: { company: true },
    });

    /* validate email */
    if (!account) throw new NotFoundException(`Invalid Account`);

    /* Check if company is active */
    if (account.company && !account.company.isActive) {
      throw new BadRequestException(
        'Your company account has been deactivated. Please contact your administrator.',
      );
    }

    /* Check if account has password set */
    if (!account.password || !account.key) {
      // If no password is set, check if they have OAuth
      if (account.authProvider === AuthProvider.GOOGLE) {
        throw new BadRequestException(
          'This account uses Google Sign-In. Please use the Google login option.',
        );
      }
      if (account.authProvider === AuthProvider.FACEBOOK) {
        throw new BadRequestException(
          'This account uses Facebook Sign-In. Please use the Facebook login option.',
        );
      }
      // No password and no OAuth - invalid account
      throw new BadRequestException(
        'Password authentication is not enabled for this account.',
      );
    }

    /* validate password - check bcrypt first, then fall back to decryption */
    let isPasswordValid = false;

    // First try bcrypt (for migrated/new accounts)
    if (account.passwordHash) {
      isPasswordValid = await bcrypt.compare(password, account.passwordHash);
    }

    // Fall back to decryption for legacy accounts
    if (!isPasswordValid && account.password && account.key) {
      const rawPassword = await this.crypt.decrypt(
        account.password,
        account.key,
      );
      isPasswordValid = rawPassword === password;
    }

    if (!isPasswordValid) throw new NotFoundException(`Invalid Account`);

    /* generate a token */
    const token = await this.generateToken(account, headers, ip);
    const accountInformation: AccountDataResponse =
      await this.accountService.getAccountInformation({ id: account.id });

    // Create/link Supabase user (required for login)
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};
    
    const supabaseResult = await this.supabaseAuthService.ensureSupabaseUser(
      account,
      password, // Only used for first-time creation
    );

    if (!supabaseResult || !supabaseResult.accessToken) {
      throw new BadRequestException(
        'Failed to authenticate with Supabase. Please contact support if this issue persists.',
      );
    }

    supabaseTokens = {
      supabaseToken: supabaseResult.accessToken,
      supabaseRefreshToken: supabaseResult.refreshToken,
    };

    // Store Supabase tokens in AccountToken
    const accountTokenRecord = await this.prisma.accountToken.findFirst({
      where: { token },
    });
    if (accountTokenRecord) {
      await this.prisma.accountToken.update({
        where: { sessionId: accountTokenRecord.sessionId },
        data: {
          supabaseAccessToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        },
      });
    }

    // create response
    const response: LoginResponse = {
      token: token,
      accountInformation: accountInformation,
      serverName: process.env.SERVER_NAME || 'DEVELOPMENT',
      ...supabaseTokens,
    };

    // log the login activity
    this.utility.log(`${accountInformation.email} has successfully logged-in.`);
    return response;
  }
  async signUp(
    params: SignUpRequest,
    headers: Headers,
    ip: string,
  ): Promise<LoginResponse> {
    const companyInformation: CompanyDataResponse =
      await this.companyService.createCompany({
        companyName: params.companyInformation.companyName,
        domainPrefix: params.companyInformation.domainPrefix,
        businessType:
          (params.companyInformation.businessType as BusinessType) ||
          BusinessType.OTHERS,
        industry:
          (params.companyInformation.industry as Industry) || Industry.OTHERS,
        registrationNo: params.companyInformation.registrationNo || '',
        phone: params.companyInformation.phone || '',
        tinNo: params.companyInformation.tinNo || '',
      });

    const getDeveloperRole: RoleDataResponse =
      await this.roleService.getDeveloperRole();

    const accountCreateParams: AccountCreateDTO = {
      firstName: params.accountInformation.firstName,
      lastName: params.accountInformation.lastName,
      middleName: '',
      contactNumber: params.accountInformation.contactNumber,
      email: params.accountInformation.email,
      username: params.accountInformation.username,
      password: params.accountInformation.password,
      roleID: getDeveloperRole.id,
      companyId: companyInformation.id,
      sourceUrl: params.sourceUrl,
    };

    const accountInformation: AccountDataResponse =
      await this.accountService.createAccount(accountCreateParams);
    const account: Account = await this.prisma.account.findUnique({
      where: { id: accountInformation.id },
    });
    const token = await this.generateToken(account, headers, ip);

    // Create Supabase user for new signups (required)
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};
    
    const supabaseResult = await this.supabaseAuthService.createSupabaseUser({
      email: accountInformation.email,
      password: params.accountInformation.password,
      metadata: {
        accountId: accountInformation.id,
        roleId: accountInformation.roleID,
        companyId: accountInformation.company?.id,
        firstName: accountInformation.firstName,
        lastName: accountInformation.lastName,
      },
    });

    if (!supabaseResult || !supabaseResult.accessToken) {
      // Rollback account creation if Supabase user creation fails
      await this.prisma.account.delete({
        where: { id: accountInformation.id },
      });
      await this.prisma.company.delete({
        where: { id: companyInformation.id },
      });
      
      throw new BadRequestException(
        'Failed to create user account in authentication system. Please try again or contact support.',
      );
    }

    supabaseTokens = {
      supabaseToken: supabaseResult.accessToken,
      supabaseRefreshToken: supabaseResult.refreshToken,
    };

    // Update account with Supabase ID
    await this.prisma.account.update({
      where: { id: accountInformation.id },
      data: {
        supabaseUserId: supabaseResult.userId,
        supabaseEmail: accountInformation.email,
      },
    });

    // Store Supabase tokens in AccountToken
    if (supabaseResult.accessToken) {
      const accountTokenRec = await this.prisma.accountToken.findFirst({
        where: { token },
      });
      if (accountTokenRec) {
        await this.prisma.accountToken.update({
          where: { sessionId: accountTokenRec.sessionId },
          data: {
            supabaseAccessToken: supabaseResult.accessToken,
            supabaseRefreshToken: supabaseResult.refreshToken,
          },
        });
      }
    }

    // Send verification email
    await this.emailVerificationService.sendVerificationEmail(
      account,
      companyInformation.companyName,
    );

    const loginResponse: LoginResponse = {
      token: token,
      accountInformation: accountInformation,
      serverName: process.env.SERVER_NAME || 'DEVELOPMENT',
      ...supabaseTokens,
    };

    return loginResponse;
  }

  async loginWithGoogle(
    googleIdToken: string,
    headers: Headers,
    ip: string,
  ): Promise<LoginResponse> {
    // Verify Google token
    const googleUser =
      await this.googleAuthService.verifyGoogleToken(googleIdToken);

    // Find account by Google ID first
    let account = await this.googleAuthService.findAccountByGoogleId(
      googleUser.sub,
    );

    if (!account) {
      // Try to find by Google email field
      account = await this.googleAuthService.findAccountByGoogleEmail(
        googleUser.email,
      );

      if (!account) {
        // Try to find by regular email field (for linking existing accounts)
        account = await this.googleAuthService.findAccountByEmail(
          googleUser.email,
        );

        if (account) {
          // Account exists with email but not linked to Google
          if (account.authProvider === AuthProvider.LOCAL) {
            throw new BadRequestException(
              'This email is already registered with a password. Please login with your password or link your Google account from settings.',
            );
          } else if (account.authProvider === AuthProvider.FACEBOOK) {
            throw new BadRequestException(
              'This email is already linked to a Facebook account. Please login with Facebook or link your Google account from settings.',
            );
          }
        } else {
          // No account exists
          throw new NotFoundException(
            'No account found with this Google email. Please sign up first or accept an invitation.',
          );
        }
      }
    }

    // Check if company is active
    const accountWithCompany = await this.prisma.account.findUnique({
      where: { id: account.id },
      include: { company: true },
    });

    if (accountWithCompany.company && !accountWithCompany.company.isActive) {
      throw new BadRequestException(
        'Your company account has been deactivated. Please contact your administrator.',
      );
    }

    // Update Google ID and email if not set
    const updateData: any = { lastLogin: new Date() };
    if (!account.googleId) {
      updateData.googleId = googleUser.sub;
    }
    if (!account.googleEmail) {
      updateData.googleEmail = googleUser.email;
    }

    // Update account with Google info and last login
    await this.prisma.account.update({
      where: { id: account.id },
      data: updateData,
    });

    // Generate token
    const token = await this.generateToken(account, headers, ip);
    const accountInformation: AccountDataResponse =
      await this.accountService.getAccountInformation({ id: account.id });

    // Create/link Supabase user for Google login (required)
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};
    
    const supabaseResult =
      await this.supabaseAuthService.ensureSupabaseUser(account);

    if (!supabaseResult || !supabaseResult.accessToken) {
      throw new BadRequestException(
        'Failed to authenticate with Supabase. Please contact support if this issue persists.',
      );
    }

    supabaseTokens = {
      supabaseToken: supabaseResult.accessToken,
      supabaseRefreshToken: supabaseResult.refreshToken,
    };

    // Store Supabase tokens in AccountToken
    const accountTokenRecord = await this.prisma.accountToken.findFirst({
      where: { token },
    });
    if (accountTokenRecord) {
      await this.prisma.accountToken.update({
        where: { sessionId: accountTokenRecord.sessionId },
        data: {
          supabaseAccessToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        },
      });
    }

    const response: LoginResponse = {
      token: token,
      accountInformation: accountInformation,
      serverName: process.env.SERVER_NAME || 'DEVELOPMENT',
      ...supabaseTokens,
    };

    this.utility.log(
      `${accountInformation.email} has successfully logged in via Google.`,
    );
    return response;
  }

  async loginWithFacebook(
    facebookAccessToken: string,
    headers: Headers,
    ip: string,
  ): Promise<LoginResponse> {
    // Verify Facebook token
    const facebookUser =
      await this.facebookAuthService.verifyFacebookToken(facebookAccessToken);

    // Find account by Facebook ID first
    let account = await this.facebookAuthService.findAccountByFacebookId(
      facebookUser.id,
    );

    if (!account) {
      // Try to find by Facebook email field
      account = await this.facebookAuthService.findAccountByFacebookEmail(
        facebookUser.email,
      );

      if (!account) {
        // Try to find by regular email field (for linking existing accounts)
        account = await this.facebookAuthService.findAccountByEmail(
          facebookUser.email,
        );

        if (account) {
          // Account exists with email but not linked to Facebook
          if (account.authProvider === AuthProvider.LOCAL) {
            throw new BadRequestException(
              'This email is already registered with a password. Please login with your password or link your Facebook account from settings.',
            );
          } else if (account.authProvider === AuthProvider.GOOGLE) {
            throw new BadRequestException(
              'This email is already linked to a Google account. Please login with Google or link your Facebook account from settings.',
            );
          }
        } else {
          // No account exists
          throw new NotFoundException(
            'No account found with this Facebook email. Please sign up first or accept an invitation.',
          );
        }
      }
    }

    // Check if company is active
    const accountWithCompany = await this.prisma.account.findUnique({
      where: { id: account.id },
      include: { company: true },
    });

    if (accountWithCompany.company && !accountWithCompany.company.isActive) {
      throw new BadRequestException(
        'Your company account has been deactivated. Please contact your administrator.',
      );
    }

    // Update Facebook ID and email if not set
    const updateData: any = { lastLogin: new Date() };
    if (!account.facebookId) {
      updateData.facebookId = facebookUser.id;
    }
    if (!account.facebookEmail) {
      updateData.facebookEmail = facebookUser.email;
    }

    // Update account with Facebook info and last login
    await this.prisma.account.update({
      where: { id: account.id },
      data: updateData,
    });

    // Generate token
    const token = await this.generateToken(account, headers, ip);
    const accountInformation: AccountDataResponse =
      await this.accountService.getAccountInformation({ id: account.id });

    // Create/link Supabase user for Facebook login (required)
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};
    
    const supabaseResult =
      await this.supabaseAuthService.ensureSupabaseUser(account);

    if (!supabaseResult || !supabaseResult.accessToken) {
      throw new BadRequestException(
        'Failed to authenticate with Supabase. Please contact support if this issue persists.',
      );
    }

    supabaseTokens = {
      supabaseToken: supabaseResult.accessToken,
      supabaseRefreshToken: supabaseResult.refreshToken,
    };

    // Store Supabase tokens in AccountToken
    const accountTokenRecord = await this.prisma.accountToken.findFirst({
      where: { token },
    });
    if (accountTokenRecord) {
      await this.prisma.accountToken.update({
        where: { sessionId: accountTokenRecord.sessionId },
        data: {
          supabaseAccessToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        },
      });
    }

    const response: LoginResponse = {
      token: token,
      accountInformation: accountInformation,
      serverName: process.env.SERVER_NAME || 'DEVELOPMENT',
      ...supabaseTokens,
    };

    this.utility.log(
      `${accountInformation.email} has successfully logged in via Facebook.`,
    );
    return response;
  }

  async generateToken(
    account: Account,
    headers: Headers,
    ip: string,
  ): Promise<string> {
    const token = this.utility.randomString();
    const insertToken: Prisma.AccountTokenCreateInput = {
      account: { connect: { id: account.id } },
      payload: Buffer.from(JSON.stringify(account)).toString('base64'),
      userAgent: headers['user-agent'],
      ipAddress: ip,
      token: token,
      status: 'active',
      updatedAt: new Date(),
    };

    const createdToken = await this.prisma.accountToken.create({
      data: insertToken,
    });

    // Cache the token immediately for future authentication requests
    try {
      const accountInformation =
        await this.accountService.getAccountInformation({ id: account.id });

      const tokenDataToCache: CachedTokenData = {
        accountId: account.id,
        accountInformation,
        createdAt: createdToken.createdAt.toISOString(),
        userAgent: headers['user-agent'],
        ipAddress: ip,
      };

      const ttl = parseInt(process.env.REDIS_AUTH_TTL) || 86400; // 24 hours default
      await this.redisService.cacheTokenData(token, tokenDataToCache, ttl);

      this.utility.log(
        `Token generated and cached: ${token.substring(0, 8)}...`,
      );
    } catch (error) {
      this.utility.log(`Error caching token on generation: ${error.message}`);
      // Don't fail the login if caching fails
    }

    return token;
  }

  async invalidateToken(token: string): Promise<void> {
    try {
      // Set token status to inactive in database
      await this.prisma.accountToken.updateMany({
        where: { token, status: 'active' },
        data: { status: 'inactive', updatedAt: new Date() },
      });

      this.utility.log(
        `Token invalidated in database: ${token.substring(0, 8)}...`,
      );
    } catch (error) {
      this.utility.log(
        `Error invalidating token in database: ${error.message}`,
      );
      throw error;
    }
  }

  async invalidateAllAccountTokens(accountId: string): Promise<void> {
    try {
      // Set all account tokens to inactive in database
      await this.prisma.accountToken.updateMany({
        where: { accountId, status: 'active' },
        data: { status: 'inactive', updatedAt: new Date() },
      });

      this.utility.log(`All tokens invalidated for account: ${accountId}`);
    } catch (error) {
      this.utility.log(
        `Error invalidating all account tokens: ${error.message}`,
      );
      throw error;
    }
  }
}
