import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { Account, AuthProvider, Prisma } from '@prisma/client';
import axios from 'axios';

export interface FacebookUserInfo {
  id: string; // Facebook user ID (unique identifier)
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

@Injectable()
export class FacebookAuthService implements OnModuleInit {
  private appId: string;
  private appSecret: string;
  private isConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.appId =
      this.configService.get<string>('FACEBOOK_APP_ID') ||
      process.env.FACEBOOK_APP_ID;
    this.appSecret =
      this.configService.get<string>('FACEBOOK_APP_SECRET') ||
      process.env.FACEBOOK_APP_SECRET;

    if (
      this.appId &&
      this.appSecret &&
      this.appId !== 'YOUR_FACEBOOK_APP_ID_HERE' &&
      this.appSecret !== 'YOUR_FACEBOOK_APP_SECRET_HERE'
    ) {
      this.isConfigured = true;
      this.utility.log(
        `Facebook OAuth initialized with App ID: ${this.appId.substring(0, 10)}...`,
      );
    } else {
      console.warn(
        'Facebook App ID or Secret not configured. Facebook OAuth will not be available.',
      );
    }
  }

  /**
   * Verify Facebook access token and extract user information
   */
  async verifyFacebookToken(accessToken: string): Promise<FacebookUserInfo> {
    if (!this.isConfigured) {
      throw new BadRequestException('Facebook OAuth is not configured');
    }

    try {
      // First, verify the token with Facebook's debug endpoint
      const debugUrl = `https://graph.facebook.com/debug_token`;
      const debugParams = {
        input_token: accessToken,
        access_token: `${this.appId}|${this.appSecret}`, // App access token
      };

      const debugResponse = await axios.get(debugUrl, { params: debugParams });

      if (!debugResponse.data?.data?.is_valid) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      // Check if the token belongs to our app
      if (debugResponse.data.data.app_id !== this.appId) {
        throw new UnauthorizedException(
          'Token does not belong to this application',
        );
      }

      // Get user information
      const userUrl = `https://graph.facebook.com/v18.0/me`;
      const userParams = {
        fields: 'id,email,first_name,last_name,name,picture',
        access_token: accessToken,
      };

      const userResponse = await axios.get(userUrl, { params: userParams });
      const userData = userResponse.data;

      // Email might not be available if the user hasn't granted the email permission
      // For development, we'll create a placeholder email if not available
      if (!userData.email) {
        console.warn(
          'Facebook user does not have email permission granted or no email associated',
        );
        // Note: In production, you should handle this case properly
        // Option 1: Request email from user via a form
        // Option 2: Use Facebook ID as a unique identifier
        // For now, we'll create a placeholder email
        userData.email = `fb_${userData.id}@facebook.local`;
      }

      return {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        name: userData.name,
        picture: userData.picture,
      };
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new UnauthorizedException('Invalid Facebook token');
      }
      this.utility.log(`Facebook token verification failed: ${error.message}`);
      throw new UnauthorizedException('Facebook authentication failed');
    }
  }

  /**
   * Find account by Facebook ID
   */
  async findAccountByFacebookId(facebookId: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { facebookId },
    });
  }

  /**
   * Find account by email
   */
  async findAccountByEmail(
    email: string,
    companyId?: number,
  ): Promise<Account | null> {
    const where: Prisma.AccountWhereInput = {
      email: email.toLowerCase(),
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.account.findFirst({ where });
  }

  /**
   * Find account by Facebook email
   */
  async findAccountByFacebookEmail(
    facebookEmail: string,
    companyId?: number,
  ): Promise<Account | null> {
    const where: Prisma.AccountWhereInput = {
      facebookEmail: facebookEmail.toLowerCase(),
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.account.findFirst({ where });
  }

  /**
   * Create a new account with Facebook authentication
   */
  async createFacebookAccount(
    facebookUser: FacebookUserInfo,
    companyId: number,
    roleId: string,
    parentAccountId?: string,
  ): Promise<Account> {
    // Generate username from Facebook data
    const baseUsername = this.generateUsername(facebookUser);
    let username = baseUsername;
    let suffix = 1;

    // Ensure username is unique
    while (await this.prisma.account.findFirst({ where: { username } })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    const accountData: Prisma.AccountCreateInput = {
      email: facebookUser.email.toLowerCase(),
      username,
      firstName:
        facebookUser.first_name ||
        facebookUser.name?.split(' ')[0] ||
        facebookUser.email.split('@')[0],
      lastName:
        facebookUser.last_name ||
        facebookUser.name?.split(' ').slice(1).join(' ') ||
        '',
      contactNumber: '',
      authProvider: AuthProvider.FACEBOOK,
      facebookId: facebookUser.id,
      isEmailVerified: true, // Facebook accounts have verified emails
      isInviteAccepted: true,
      role: { connect: { id: roleId } },
      company: { connect: { id: companyId } },
      searchKeyword:
        `${facebookUser.first_name || ''} ${facebookUser.last_name || ''} ${facebookUser.email}`.toLowerCase(),
      ...(parentAccountId
        ? { parent: { connect: { id: parentAccountId } } }
        : {}),
    };

    const account = await this.prisma.account.create({
      data: accountData,
      include: {
        role: true,
        company: true,
      },
    });

    this.utility.log(
      `Facebook account created for ${facebookUser.email} (${username})`,
    );
    return account;
  }

  /**
   * Link Facebook account to existing account
   */
  async linkFacebookToExistingAccount(
    accountId: string,
    facebookId: string,
  ): Promise<Account> {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        facebookId,
        authProvider: AuthProvider.FACEBOOK,
        isEmailVerified: true,
      },
    });

    this.utility.log(`Facebook account linked for account ${accountId}`);
    return account;
  }

  /**
   * Update account information from Facebook profile
   */
  async updateAccountFromFacebook(
    accountId: string,
    facebookUser: FacebookUserInfo,
  ): Promise<Account> {
    const updateData: Prisma.AccountUpdateInput = {};

    // Only update if the fields are empty
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (!account.firstName && facebookUser.first_name) {
      updateData.firstName = facebookUser.first_name;
    }

    if (!account.lastName && facebookUser.last_name) {
      updateData.lastName = facebookUser.last_name;
    }

    if (Object.keys(updateData).length > 0) {
      return this.prisma.account.update({
        where: { id: accountId },
        data: updateData,
      });
    }

    return account;
  }

  /**
   * Generate a username from Facebook user info
   */
  private generateUsername(facebookUser: FacebookUserInfo): string {
    if (facebookUser.first_name && facebookUser.last_name) {
      // Use first name + last name (lowercase, no spaces)
      return `${facebookUser.first_name}${facebookUser.last_name}`
        .toLowerCase()
        .replace(/\s+/g, '');
    } else if (facebookUser.name) {
      // Use full name (lowercase, no spaces)
      return facebookUser.name.toLowerCase().replace(/\s+/g, '');
    } else {
      // Use email prefix
      return facebookUser.email.split('@')[0].toLowerCase();
    }
  }

  /**
   * Check if Facebook OAuth is configured
   */
  isFacebookAuthConfigured(): boolean {
    return this.isConfigured;
  }
}
