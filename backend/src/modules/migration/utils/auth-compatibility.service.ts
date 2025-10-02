import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EncryptionService } from '@common/encryption.service';
import { PrismaService } from '@common/prisma.service';

@Injectable()
export class AuthCompatibilityService {
  private readonly logger = new Logger(AuthCompatibilityService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Verify password using either bcrypt (new) or encryption (legacy)
   * Automatically migrates legacy passwords to bcrypt on successful login
   */
  async verifyPassword(
    accountId: string,
    plainPassword: string,
    passwordHash?: string,
    encryptedPassword?: string,
    encryptionKey?: Buffer,
  ): Promise<boolean> {
    try {
      // First, try bcrypt if passwordHash exists
      if (passwordHash) {
        const isValid = await bcrypt.compare(plainPassword, passwordHash);
        if (isValid) {
          this.logger.debug(
            `Password verified using bcrypt for account ${accountId}`,
          );
          return true;
        }
      }

      // Fallback to legacy encryption if available
      if (encryptedPassword && encryptionKey) {
        try {
          const decryptedPassword = await this.encryptionService.decrypt(
            encryptedPassword,
            encryptionKey,
          );

          if (decryptedPassword === plainPassword) {
            this.logger.debug(
              `Password verified using legacy encryption for account ${accountId}`,
            );

            // Migrate to bcrypt on successful login
            await this.migratePasswordToBcrypt(accountId, plainPassword);

            return true;
          }
        } catch (error) {
          this.logger.error(
            `Failed to decrypt legacy password for account ${accountId}: ${error.message}`,
          );
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Password verification failed for account ${accountId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Migrate a single account's password to bcrypt
   */
  private async migratePasswordToBcrypt(
    accountId: string,
    plainPassword: string,
  ): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(plainPassword);

      // Update account with bcrypt hash
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Account" SET "passwordHash" = $1 WHERE id = $2`,
        hashedPassword,
        accountId,
      );

      this.logger.log(
        `Successfully migrated password to bcrypt for account ${accountId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to migrate password to bcrypt for account ${accountId}: ${error.message}`,
      );
      // Don't throw - allow login to proceed even if migration fails
    }
  }

  /**
   * Check if an account needs password migration
   */
  async needsPasswordMigration(accountId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        password: true,
        key: true,
        passwordHash: true,
      },
    });

    if (!account) {
      return false;
    }

    // Needs migration if has legacy password but no bcrypt hash
    return !!(account.password && account.key && !account.passwordHash);
  }

  /**
   * Get password verification method for an account
   */
  async getPasswordMethod(
    accountId: string,
  ): Promise<'bcrypt' | 'legacy' | 'none'> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        password: true,
        key: true,
        passwordHash: true,
      },
    });

    if (!account) {
      return 'none';
    }

    if (account.passwordHash) {
      return 'bcrypt';
    }

    if (account.password && account.key) {
      return 'legacy';
    }

    return 'none';
  }
}
