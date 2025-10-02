import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import {
  Migration,
  MigrationContext,
  MigrationResult,
} from '../interfaces/migration.interface';

export class PasswordBcryptMigration extends Migration {
  name = '001-password-bcrypt';
  version = '1.0.0';
  description =
    'Migrate passwords from AES-256-CTR encryption to bcrypt hashing';
  rollbackable = false; // Cannot reverse hashing
  logger = new Logger(PasswordBcryptMigration.name);

  private readonly prisma = new PrismaClient();
  private readonly encryptionKey = process.env.ENCRYPTION_KEY;
  private readonly encryptionMode = 'aes-256-ctr';
  private readonly saltRounds = 10;

  async up(context: MigrationContext): Promise<MigrationResult> {
    try {
      if (!this.encryptionKey) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
      }

      // First, check if passwordHash column exists
      const columnExists = await this.checkPasswordHashColumn();
      if (!columnExists && !context.dryRun) {
        this.logger.log('Adding passwordHash column to Account table');
        await this.addPasswordHashColumn();
      }

      // Get all accounts with encrypted passwords
      const accounts = await this.prisma.account.findMany({
        where: {
          AND: [
            { password: { not: null } },
            { key: { not: null } },
            {
              OR: [{ passwordHash: null }, { passwordHash: '' }],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          key: true,
        },
      });

      this.logger.log(`Found ${accounts.length} accounts to migrate`);

      if (context.dryRun) {
        this.logger.log('DRY RUN - Would migrate the following accounts:');
        accounts.forEach((account) => {
          this.logger.log(`  - ${account.username} (${account.email})`);
        });
        return {
          success: true,
          recordsProcessed: accounts.length,
          metadata: {
            accountIds: accounts.map((a) => a.id),
            dryRun: true,
          },
        };
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process in batches
      const batchSize = context.batchSize || 100;
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);

        if (context.verbose) {
          this.logger.log(
            `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(accounts.length / batchSize)}`,
          );
        }

        await Promise.all(
          batch.map(async (account) => {
            try {
              // Decrypt the password
              const decryptedPassword = await this.decrypt(
                account.password,
                account.key,
              );

              // Hash with bcrypt
              const hashedPassword = await bcrypt.hash(
                decryptedPassword,
                this.saltRounds,
              );

              // Update the account with the hashed password
              await this.prisma.$executeRawUnsafe(
                `UPDATE "Account" SET "passwordHash" = $1 WHERE id = $2`,
                hashedPassword,
                account.id,
              );

              successCount++;

              if (context.verbose) {
                this.logger.log(`Migrated password for ${account.username}`);
              }

              return { success: true, accountId: account.id };
            } catch (error) {
              errorCount++;
              errors.push({
                accountId: account.id,
                username: account.username,
                error: error.message,
              });

              this.logger.error(
                `Failed to migrate password for ${account.username}: ${error.message}`,
              );

              return {
                success: false,
                accountId: account.id,
                error: error.message,
              };
            }
          }),
        );
      }

      this.logger.log(
        `Migration completed: ${successCount} success, ${errorCount} errors`,
      );

      return {
        success: errorCount === 0,
        recordsProcessed: successCount,
        error:
          errorCount > 0
            ? `Failed to migrate ${errorCount} accounts`
            : undefined,
        metadata: {
          totalAccounts: accounts.length,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      this.logger.error('Migration failed:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verify(): Promise<boolean> {
    try {
      // Check if all accounts with passwords have passwordHash
      const accountsWithoutHash = await this.prisma.account.count({
        where: {
          AND: [
            { password: { not: null } },
            { key: { not: null } },
            {
              OR: [{ passwordHash: null }, { passwordHash: '' }],
            },
          ],
        },
      });

      if (accountsWithoutHash > 0) {
        this.logger.warn(
          `Found ${accountsWithoutHash} accounts without password hash`,
        );
        return false;
      }

      // Sample verification: Check a few accounts to ensure bcrypt hashes are valid
      const sampleAccounts = await this.prisma.account.findMany({
        where: {
          passwordHash: { not: null },
        },
        take: 5,
        select: {
          id: true,
          passwordHash: true,
        },
      });

      for (const account of sampleAccounts) {
        // Check if it's a valid bcrypt hash (starts with $2a$, $2b$, or $2y$)
        if (!account.passwordHash.match(/^\$2[aby]\$\d{2}\$/)) {
          this.logger.error(
            `Invalid bcrypt hash format for account ${account.id}`,
          );
          return false;
        }
      }

      this.logger.log('Migration verification passed');
      return true;
    } catch (error) {
      this.logger.error('Verification failed:', error);
      return false;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async checkPasswordHashColumn(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Account' 
        AND column_name = 'passwordHash'
      `;
      return (result as any[]).length > 0;
    } catch (error) {
      this.logger.error('Error checking passwordHash column:', error);
      return false;
    }
  }

  private async addPasswordHashColumn(): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        ALTER TABLE "Account" 
        ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255)
      `;
      this.logger.log('Successfully added passwordHash column');
    } catch (error) {
      this.logger.error('Error adding passwordHash column:', error);
      throw error;
    }
  }

  private async decrypt(
    encryptedText: string,
    iv: Buffer | string | any,
  ): Promise<string> {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Invalid encrypted text');
      }

      if (encryptedText && !/^[0-9a-fA-F]*$/.test(encryptedText)) {
        throw new Error('Invalid encrypted text format');
      }

      if (!iv) {
        throw new Error('Invalid IV');
      }

      let ivBuffer: Buffer;
      if (typeof iv === 'string') {
        if (!/^[0-9a-fA-F]+$/.test(iv) || iv.length % 2 !== 0) {
          throw new Error('Invalid IV hex format');
        }
        ivBuffer = Buffer.from(iv, 'hex');
      } else if (Buffer.isBuffer(iv)) {
        if (iv.length !== 16) {
          throw new Error('Invalid IV length');
        }
        ivBuffer = iv;
      } else {
        throw new Error('Invalid IV format');
      }

      const key = (await promisify(scrypt)(
        this.encryptionKey,
        'salt',
        32,
      )) as Buffer;

      const decipher = createDecipheriv(this.encryptionMode, key, ivBuffer);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}
