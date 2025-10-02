import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { Account, AuthProvider, Prisma } from '@prisma/client';

export interface GoogleUserInfo {
  sub: string; // Google user ID (unique identifier)
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthService implements OnModuleInit {
  private client: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const clientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID;
    if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      this.client = new OAuth2Client(clientId);
      this.utility.log(
        `Google OAuth initialized with Client ID: ${clientId.substring(0, 10)}...`,
      );
    } else {
      console.warn(
        'Google Client ID not configured. Google OAuth will not be available.',
      );
    }
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    if (!this.client) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      if (!payload.email_verified) {
        throw new BadRequestException('Google email is not verified');
      }

      return {
        sub: payload.sub,
        email: payload.email!,
        email_verified: payload.email_verified,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      this.utility.log(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Find account by Google ID
   */
  async findAccountByGoogleId(googleId: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { googleId },
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
   * Find account by Google email
   */
  async findAccountByGoogleEmail(
    googleEmail: string,
    companyId?: number,
  ): Promise<Account | null> {
    const where: Prisma.AccountWhereInput = {
      googleEmail: googleEmail.toLowerCase(),
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.account.findFirst({ where });
  }

  /**
   * Create a new account with Google authentication
   */
  async createGoogleAccount(
    googleUser: GoogleUserInfo,
    companyId: number,
    roleId: string,
    parentAccountId?: string,
  ): Promise<Account> {
    // Generate username from email or Google name
    const baseUsername = this.generateUsername(googleUser);
    let username = baseUsername;
    let suffix = 1;

    // Ensure username is unique
    while (await this.prisma.account.findFirst({ where: { username } })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    const accountData: Prisma.AccountCreateInput = {
      email: googleUser.email.toLowerCase(),
      username,
      firstName: googleUser.given_name || googleUser.email.split('@')[0],
      lastName: googleUser.family_name || '',
      contactNumber: '',
      authProvider: AuthProvider.GOOGLE,
      googleId: googleUser.sub,
      isEmailVerified: true, // Google accounts are pre-verified
      isInviteAccepted: true,
      role: { connect: { id: roleId } },
      company: { connect: { id: companyId } },
      searchKeyword:
        `${googleUser.given_name || ''} ${googleUser.family_name || ''} ${googleUser.email}`.toLowerCase(),
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
      `Google account created for ${googleUser.email} (${username})`,
    );
    return account;
  }

  /**
   * Link Google account to existing account
   */
  async linkGoogleToExistingAccount(
    accountId: string,
    googleId: string,
  ): Promise<Account> {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        googleId,
        authProvider: AuthProvider.GOOGLE,
        isEmailVerified: true,
      },
    });

    this.utility.log(`Google account linked for account ${accountId}`);
    return account;
  }

  /**
   * Update account information from Google profile
   */
  async updateAccountFromGoogle(
    accountId: string,
    googleUser: GoogleUserInfo,
  ): Promise<Account> {
    const updateData: Prisma.AccountUpdateInput = {};

    // Only update if the fields are empty
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (!account.firstName && googleUser.given_name) {
      updateData.firstName = googleUser.given_name;
    }

    if (!account.lastName && googleUser.family_name) {
      updateData.lastName = googleUser.family_name;
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
   * Generate a username from Google user info
   */
  private generateUsername(googleUser: GoogleUserInfo): string {
    if (googleUser.given_name && googleUser.family_name) {
      // Use first name + last name (lowercase, no spaces)
      return `${googleUser.given_name}${googleUser.family_name}`
        .toLowerCase()
        .replace(/\s+/g, '');
    } else if (googleUser.name) {
      // Use full name (lowercase, no spaces)
      return googleUser.name.toLowerCase().replace(/\s+/g, '');
    } else {
      // Use email prefix
      return googleUser.email.split('@')[0].toLowerCase();
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  isGoogleAuthConfigured(): boolean {
    return !!this.client;
  }
}
