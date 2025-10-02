import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { AuthProvider } from '@prisma/client';
import { EncryptionService } from '@common/encryption.service';
import { AuthCompatibilityService } from '../../migration/utils/auth-compatibility.service';

/**
 * Enhanced Auth Service that supports both legacy encryption and modern bcrypt
 * This service should replace the existing auth.service.ts after testing
 */
@Injectable()
export class AuthEnhancedService {
  private readonly logger = new Logger(AuthEnhancedService.name);

  constructor(
    @Inject() private prisma: PrismaService,
    @Inject() private crypt: EncryptionService,
    @Inject() private authCompatibility: AuthCompatibilityService,
  ) {}

  async validatePassword(username: string, password: string): Promise<any> {
    const account = await this.prisma.account.findFirst({
      where: { OR: [{ email: username }, { username }] },
      include: { company: true },
    });

    if (!account) {
      throw new NotFoundException('Invalid Account');
    }

    // Check if company is active
    if (account.company && !account.company.isActive) {
      throw new BadRequestException(
        'Your company account has been deactivated. Please contact your administrator.',
      );
    }

    // Handle OAuth accounts
    if (!account.password && !account.passwordHash) {
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
      throw new BadRequestException(
        'Password authentication is not enabled for this account.',
      );
    }

    // Use compatibility service to verify password (supports both methods)
    const isValidPassword = await this.authCompatibility.verifyPassword(
      account.id,
      password,
      account.passwordHash,
      account.password,
      account.key,
    );

    if (!isValidPassword) {
      throw new NotFoundException('Invalid Account');
    }

    // Log which method was used for monitoring
    const method = await this.authCompatibility.getPasswordMethod(account.id);
    this.logger.debug(
      `Account ${account.username} authenticated using ${method} method`,
    );

    return account;
  }

  async setPassword(accountId: string, newPassword: string): Promise<void> {
    // Use bcrypt for all new passwords
    const hashedPassword =
      await this.authCompatibility.hashPassword(newPassword);

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        passwordHash: hashedPassword,
        // Clear legacy fields when setting new password
        password: null,
        key: null,
      },
    });

    this.logger.log(`Password updated using bcrypt for account ${accountId}`);
  }

  async changePassword(
    accountId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        password: true,
        key: true,
        passwordHash: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify old password
    const isValidPassword = await this.authCompatibility.verifyPassword(
      accountId,
      oldPassword,
      account.passwordHash,
      account.password,
      account.key,
    );

    if (!isValidPassword) {
      throw new BadRequestException('Invalid current password');
    }

    // Set new password (always uses bcrypt)
    await this.setPassword(accountId, newPassword);
  }
}
