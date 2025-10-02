import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { SupabaseService } from '@infrastructure/supabase/supabase.service';
import { Account } from '@prisma/client';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  @Inject() private prisma: PrismaService;
  @Inject() private supabaseService: SupabaseService;
  @Inject() private utility: UtilityService;

  /**
   * Ensure a Supabase user exists for the given ANTE account
   * Creates one if it doesn't exist, or returns existing tokens
   */
  async ensureSupabaseUser(account: Account, password?: string) {
    try {
      // Skip caching - always generate fresh tokens
      this.logger.log(
        `Generating fresh Supabase tokens for account: ${account.id}`,
      );

      // If account already has Supabase user ID, validate it first
      if (account.supabaseUserId) {
        this.logger.log(
          `Validating existing Supabase user ID: ${account.supabaseUserId}`,
        );

        // Validate if the supabaseUserId actually exists in Supabase
        const isValidUserId = await this.supabaseService.validateSupabaseUserId(
          account.supabaseUserId,
        );

        if (!isValidUserId) {
          this.logger.warn(
            `Invalid supabaseUserId detected for account ${account.id}: ${account.supabaseUserId}. Creating new Supabase user.`,
          );

          // Clear the invalid supabaseUserId from the account
          await this.clearInvalidSupabaseUserId(account);

          // Fall through to user creation logic below
        } else {
          // Valid supabaseUserId - use existing authentication flow
          this.logger.log(
            `Using native Supabase authentication for user: ${account.supabaseUserId}`,
          );

          // Use a deterministic password based on account ID for consistency
          const deterministicPassword = this.generateDeterministicPassword(
            account.id,
          );

          // First, ensure the user's password is set to our deterministic password
          const updateResult = await this.supabaseService.updateAuthUser(
            account.supabaseUserId,
            {
              password: deterministicPassword,
            },
          );

          if (updateResult.error) {
            this.logger.error(
              `Failed to update password for Supabase user ${account.supabaseUserId}: ${updateResult.error}`,
            );
            // If we can't update the password, treat this as an invalid user
            await this.clearInvalidSupabaseUserId(account);
            // Fall through to creation logic
          } else {
            // Use custom token generation to ensure proper metadata
            const tokens = await this.supabaseService.generateAccessToken(
              account.supabaseUserId,
              {
                email: account.email,
                accountId: account.id,
                roleId: account.roleId,
                companyId: account.companyId,
              },
            );

            if (tokens.error) {
              this.logger.error(
                `Failed to generate tokens for Supabase user ${account.supabaseUserId}: ${tokens.error}`,
              );
              // If token generation fails, treat this as an invalid user
              await this.clearInvalidSupabaseUserId(account);
              // Fall through to creation logic
            } else {
              this.logger.log(
                `Generated custom tokens for validated Supabase user: ${account.supabaseUserId}`,
              );

              // Debug: Validate token structure
              await this.debugTokenStructure(tokens.accessToken, account.id);

              return {
                userId: account.supabaseUserId,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              };
            }
          }
        }
      }

      // Check if user exists in Supabase by email
      const existingUser = await this.supabaseService.getUserByEmail(
        account.email,
      );

      if (existingUser.data) {
        // Check if this is a guardian account (email starts with 'guardian.')
        const isGuardian = account.email.startsWith('guardian.');

        // User exists in Supabase but not linked to ANTE account
        this.logger.log(
          `Linking existing Supabase user to ${isGuardian ? 'guardian' : 'ANTE account'}: ${account.id}`,
        );

        if (!isGuardian) {
          // Only update Account record for non-guardian users
          await this.prisma.account.update({
            where: { id: account.id },
            data: {
              supabaseUserId: existingUser.data.id,
              supabaseEmail: existingUser.data.email,
            },
          });
        }

        // Use deterministic password for existing user
        const deterministicPassword =
          password || this.generateDeterministicPassword(account.id);

        // Update the user's password to our deterministic password
        await this.supabaseService.updateAuthUser(existingUser.data.id, {
          password: deterministicPassword,
        });

        // Use custom token generation to ensure proper metadata
        const tokens = await this.supabaseService.generateAccessToken(
          existingUser.data.id,
          {
            email: account.email,
            accountId: account.id,
            roleId: account.roleId,
            companyId: account.companyId,
          },
        );

        if (tokens.error) {
          this.logger.error(
            `Failed to generate tokens for existing Supabase user: ${tokens.error}`,
          );
          return null;
        }

        // Return proper session tokens with metadata
        return {
          userId: existingUser.data.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      }

      // Create new Supabase user
      const result = await this.createSupabaseUserWithRetry(account, password);

      if (result) {
        // Check if this is a guardian account (email starts with 'guardian.')
        const isGuardian = account.email.startsWith('guardian.');

        if (!isGuardian) {
          // Only update Account record for non-guardian users
          await this.prisma.account.update({
            where: { id: account.id },
            data: {
              supabaseUserId: result.userId,
              supabaseEmail: account.email,
            },
          });
        }

        this.logger.log(
          `Created and linked Supabase user for ${isGuardian ? 'guardian' : 'account'}: ${account.id}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to ensure Supabase user: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a new Supabase user with retry logic
   */
  private async createSupabaseUserWithRetry(
    account: Account,
    password?: string,
    retries = 3,
  ) {
    let lastError: string = null;

    for (let i = 0; i < retries; i++) {
      try {
        // Generate a secure password if not provided
        const supabasePassword = password || this.generateSecurePassword();

        const createResult = await this.supabaseService.createAuthUser(
          account.email,
          supabasePassword,
          {
            accountId: account.id,
            roleId: account.roleId,
            companyId: account.companyId,
            firstName: account.firstName,
            lastName: account.lastName,
          },
        );

        if (createResult.error) {
          // Handle specific Supabase errors
          if (createResult.error.includes('already registered')) {
            // User exists, try to link
            const existingUser = await this.supabaseService.getUserByEmail(
              account.email,
            );
            if (existingUser.data) {
              // Use deterministic password for existing user
              const deterministicPassword =
                password || this.generateDeterministicPassword(account.id);

              // Update the user's password
              await this.supabaseService.updateAuthUser(existingUser.data.id, {
                password: deterministicPassword,
              });

              // Use custom token generation to ensure proper metadata
              const tokens = await this.supabaseService.generateAccessToken(
                existingUser.data.id,
                {
                  email: account.email,
                  accountId: account.id,
                  roleId: account.roleId,
                  companyId: account.companyId,
                },
              );

              if (tokens.error) {
                this.logger.error(`Failed to generate tokens: ${tokens.error}`);
                return null;
              }

              return {
                userId: existingUser.data.id,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              };
            }
          }

          lastError = createResult.error;

          // If not the last retry, wait with exponential backoff
          if (i < retries - 1) {
            await this.delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
            continue;
          }
        } else {
          // Success - use custom token generation to ensure proper metadata
          const tokens = await this.supabaseService.generateAccessToken(
            createResult.data.userId,
            {
              email: account.email,
              accountId: account.id,
              roleId: account.roleId,
              companyId: account.companyId,
            },
          );

          if (tokens.error) {
            this.logger.error(
              `Failed to generate tokens after user creation: ${tokens.error}`,
            );
            return null;
          }

          return {
            userId: createResult.data.userId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          };
        }
      } catch (error) {
        lastError = error.message;
        this.logger.error(`Attempt ${i + 1} failed: ${error.message}`);

        if (i < retries - 1) {
          await this.delay(Math.pow(2, i) * 1000);
        }
      }
    }

    this.logger.error(
      `Failed to create Supabase user after ${retries} attempts: ${lastError}`,
    );
    return null;
  }

  /**
   * Create a Supabase user for new signups
   */
  async createSupabaseUser(params: {
    email: string;
    password: string;
    metadata: {
      accountId: string;
      roleId: string;
      companyId?: number;
      firstName?: string;
      lastName?: string;
    };
  }) {
    try {
      const createResult = await this.supabaseService.createAuthUser(
        params.email,
        params.password,
        params.metadata,
      );

      if (createResult.error) {
        this.logger.error(
          `Failed to create Supabase user: ${createResult.error}`,
        );
        return null;
      }

      // Generate tokens for the new user
      const tokens = await this.supabaseService.generateAccessToken(
        createResult.data.userId,
        {
          email: params.email,
          accountId: params.metadata.accountId,
          roleId: params.metadata.roleId,
          companyId: params.metadata.companyId,
        },
      );

      if (tokens.error) {
        this.logger.error(`Failed to generate tokens: ${tokens.error}`);
        return {
          userId: createResult.data.userId,
          accessToken: null,
          refreshToken: null,
        };
      }

      return {
        userId: createResult.data.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error(`Failed to create Supabase user: ${error.message}`);
      return null;
    }
  }

  /**
   * Update Supabase user when ANTE account is updated
   */
  async updateSupabaseUser(account: Account, updates: any) {
    if (!account.supabaseUserId) {
      return;
    }

    try {
      const metadata: any = {};

      if (updates.firstName) metadata.firstName = updates.firstName;
      if (updates.lastName) metadata.lastName = updates.lastName;
      if (updates.roleId) metadata.roleId = updates.roleId;
      if (updates.companyId !== undefined)
        metadata.companyId = updates.companyId;

      const updateData: any = {};
      if (updates.email) updateData.email = updates.email;
      if (Object.keys(metadata).length > 0) updateData.metadata = metadata;

      if (Object.keys(updateData).length > 0) {
        await this.supabaseService.updateAuthUser(
          account.supabaseUserId,
          updateData,
        );
        this.logger.log(`Updated Supabase user: ${account.supabaseUserId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update Supabase user: ${error.message}`);
    }
  }

  /**
   * Delete Supabase user when ANTE account is deleted
   */
  async deleteSupabaseUser(account: Account) {
    if (!account.supabaseUserId) {
      return;
    }

    try {
      await this.supabaseService.deleteAuthUser(account.supabaseUserId);
      this.logger.log(`Deleted Supabase user: ${account.supabaseUserId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Supabase user: ${error.message}`);
    }
  }

  /**
   * Generate a secure password for Supabase users
   */
  private generateSecurePassword(): string {
    // Generate a secure password using the utility service
    return this.utility.randomString() + '_Sb2024!';
  }

  /**
   * Generate a deterministic password based on account ID
   * This ensures consistent passwords for the same account across requests
   */
  private generateDeterministicPassword(accountId: string): string {
    // Use a deterministic approach based on account ID
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(accountId + process.env.JWT_SECRET) // Use JWT_SECRET as salt
      .digest('hex');

    // Create a strong password from the hash
    return `Ante_${hash.substring(0, 16)}_2024!`;
  }

  /**
   * Clear invalid supabaseUserId from account record
   * This is called when we detect that the stored supabaseUserId is invalid
   */
  private async clearInvalidSupabaseUserId(account: Account): Promise<void> {
    try {
      // Check if this is a guardian account (email starts with 'guardian.')
      const isGuardian = account.email.startsWith('guardian.');

      if (!isGuardian) {
        // Only update Account record for non-guardian users
        await this.prisma.account.update({
          where: { id: account.id },
          data: {
            supabaseUserId: null,
            supabaseEmail: null,
          },
        });

        this.logger.log(
          `Cleared invalid supabaseUserId from account: ${account.id}`,
        );
      } else {
        this.logger.log(
          `Skipped clearing supabaseUserId for guardian account: ${account.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to clear invalid supabaseUserId for account ${account.id}: ${error.message}`,
      );
      // Don't throw - we want to continue with user creation
    }
  }

  /**
   * Debug function to validate JWT token structure
   * This helps troubleshoot RLS policy issues by logging token metadata
   */
  private async debugTokenStructure(
    accessToken: string,
    accountId: string,
  ): Promise<void> {
    try {
      // Decode token without verification to inspect structure
      const decoded = this.supabaseService.decodeTokenClaims(accessToken);

      if (decoded) {
        this.logger.debug(`JWT token structure for account ${accountId}:`, {
          sub: decoded.sub,
          email: decoded.email,
          user_metadata: decoded.user_metadata,
          companyId: decoded.user_metadata?.companyId,
          roleId: decoded.user_metadata?.roleId,
          accountId: decoded.user_metadata?.accountId,
          aud: decoded.aud,
          role: decoded.role,
        });

        // Validate required fields for RLS policies
        const requiredFields = ['companyId', 'accountId', 'roleId'];
        const missing = requiredFields.filter(
          (field) => !decoded.user_metadata?.[field],
        );

        if (missing.length > 0) {
          this.logger.warn(
            `JWT token missing required metadata fields: ${missing.join(', ')} for account ${accountId}`,
          );
        } else {
          this.logger.debug(
            `JWT token validation passed for account ${accountId}`,
          );
        }
      } else {
        this.logger.error(
          `Failed to decode JWT token for account ${accountId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error debugging token structure for account ${accountId}: ${error.message}`,
      );
    }
  }

  /**
   * Helper function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
