import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  RedisService,
  CachedSupabaseToken,
} from '@infrastructure/redis/redis.service';
import { SupabaseService } from '@infrastructure/supabase/supabase.service';
import { Account } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

@Injectable()
export class SupabaseTokenManagerService {
  private readonly logger = new Logger(SupabaseTokenManagerService.name);
  private readonly tokenRefreshThreshold: number;
  private readonly enableTokenRotation: boolean;

  @Inject() private prisma: PrismaService;
  @Inject() private redisService: RedisService;
  @Inject() private supabaseService: SupabaseService;

  constructor() {
    // Configuration from environment
    this.tokenRefreshThreshold =
      parseInt(process.env.SUPABASE_TOKEN_REFRESH_THRESHOLD) || 300; // 5 minutes default
    this.enableTokenRotation =
      process.env.SUPABASE_ENABLE_TOKEN_ROTATION === 'true';
  }

  /**
   * Get a valid access token for the account
   * Returns cached token if valid, otherwise refreshes it
   */
  async getValidAccessToken(accountId: string): Promise<string | null> {
    try {
      // Check cache first
      const cachedToken =
        await this.redisService.getCachedSupabaseAccessToken(accountId);

      if (cachedToken) {
        // Check if token needs refresh (within threshold of expiry)
        const timeUntilExpiry = (cachedToken.expiresAt - Date.now()) / 1000;

        if (timeUntilExpiry > this.tokenRefreshThreshold) {
          this.logger.debug(
            `Using cached Supabase access token for account: ${accountId}`,
          );
          return cachedToken.token;
        }

        // Token is close to expiry, refresh it
        this.logger.debug(
          `Supabase access token near expiry for account: ${accountId}, refreshing...`,
        );
      }

      // No cached token or needs refresh
      return await this.refreshAccessToken(accountId);
    } catch (error) {
      this.logger.error(`Error getting valid access token: ${error.message}`);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(accountId: string): Promise<string | null> {
    try {
      // Get refresh token from cache or database
      const refreshToken = await this.getRefreshToken(accountId);

      if (!refreshToken) {
        this.logger.warn(
          `No refresh token available for account: ${accountId}`,
        );
        return null;
      }

      // Get account details for metadata
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account || !account.supabaseUserId) {
        this.logger.warn(
          `Account not found or no Supabase user ID: ${accountId}`,
        );
        return null;
      }

      // Use Supabase service to refresh the token
      const result =
        await this.supabaseService.refreshAccessTokenWithRefreshToken(
          refreshToken,
          account.supabaseUserId,
        );

      if (!result || result.error) {
        this.logger.error(
          `Failed to refresh token: ${result?.error || 'Unknown error'}`,
        );

        // If refresh failed, invalidate the tokens
        await this.redisService.invalidateSupabaseTokens(accountId);
        return null;
      }

      // Handle token rotation if enabled
      if (this.enableTokenRotation && result.newRefreshToken) {
        await this.rotateRefreshToken(
          accountId,
          result.newRefreshToken,
          account.supabaseUserId,
        );
      }

      // Cache the new access token
      await this.redisService.updateSupabaseAccessToken(
        accountId,
        result.accessToken,
        account.supabaseUserId,
        result.expiresIn || 3600,
      );

      // Update database with new tokens
      await this.updateStoredTokens(
        accountId,
        result.accessToken,
        result.newRefreshToken,
      );

      this.logger.debug(
        `Successfully refreshed access token for account: ${accountId}`,
      );
      return result.accessToken;
    } catch (error) {
      this.logger.error(`Error refreshing access token: ${error.message}`);
      return null;
    }
  }

  /**
   * Implement secure refresh token rotation
   */
  async rotateRefreshToken(
    accountId: string,
    newRefreshToken: string,
    userId: string,
  ): Promise<void> {
    try {
      // Mark old refresh token as used (for security auditing)
      const oldToken =
        await this.redisService.getCachedSupabaseRefreshToken(accountId);

      if (oldToken) {
        // Store old token in a blacklist with short TTL for security checks
        const blacklistKey = `supabase:blacklist:${oldToken.token.substring(0, 20)}`;
        await this.redisService.set(
          blacklistKey,
          { accountId, usedAt: Date.now() },
          86400,
        ); // 24 hour TTL
      }

      // Cache the new refresh token
      const refreshTokenTTL =
        parseInt(process.env.SUPABASE_REFRESH_TOKEN_TTL) || 2592000; // 30 days
      await this.redisService.cacheSupabaseTokens(
        accountId,
        '', // We're only updating refresh token
        newRefreshToken,
        userId,
        1, // Access token TTL (not used here)
        refreshTokenTTL,
      );

      this.logger.debug(`Refresh token rotated for account: ${accountId}`);
    } catch (error) {
      this.logger.error(`Error rotating refresh token: ${error.message}`);
    }
  }

  /**
   * Validate token expiry without making an API call
   */
  validateTokenExpiry(token: string): { valid: boolean; expiresIn?: number } {
    try {
      // Decode without verification (just to check expiry)
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.exp) {
        return { valid: false };
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;

      return {
        valid: expiresIn > 0,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Error validating token expiry: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Get refresh token from cache or database
   */
  private async getRefreshToken(accountId: string): Promise<string | null> {
    try {
      // Check cache first
      const cachedToken =
        await this.redisService.getCachedSupabaseRefreshToken(accountId);

      if (cachedToken) {
        return cachedToken.token;
      }

      // Fall back to database
      const tokens = await this.prisma.accountToken.findFirst({
        where: {
          accountId,
          status: 'active',
          supabaseRefreshToken: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (tokens?.supabaseRefreshToken) {
        // Cache it for future use
        const account = await this.prisma.account.findUnique({
          where: { id: accountId },
          select: { supabaseUserId: true },
        });

        if (account?.supabaseUserId) {
          const refreshTokenTTL =
            parseInt(process.env.SUPABASE_REFRESH_TOKEN_TTL) || 2592000;
          await this.redisService.cacheSupabaseTokens(
            accountId,
            tokens.supabaseAccessToken || '',
            tokens.supabaseRefreshToken,
            account.supabaseUserId,
            3600, // Access token TTL
            refreshTokenTTL,
          );
        }

        return tokens.supabaseRefreshToken;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting refresh token: ${error.message}`);
      return null;
    }
  }

  /**
   * Update stored tokens in database
   */
  private async updateStoredTokens(
    accountId: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    try {
      const updateData: any = {
        supabaseAccessToken: accessToken,
      };

      if (refreshToken) {
        updateData.supabaseRefreshToken = refreshToken;
      }

      await this.prisma.accountToken.updateMany({
        where: {
          accountId,
          status: 'active',
        },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Error updating stored tokens: ${error.message}`);
    }
  }

  /**
   * Check if a refresh token has been blacklisted (used for rotation security)
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistKey = `supabase:blacklist:${token.substring(0, 20)}`;
      return await this.redisService.exists(blacklistKey);
    } catch (error) {
      this.logger.error(`Error checking token blacklist: ${error.message}`);
      return false;
    }
  }

  /**
   * Invalidate all Supabase tokens for an account
   */
  async invalidateAllTokens(accountId: string): Promise<void> {
    try {
      // Clear cache
      await this.redisService.invalidateSupabaseTokens(accountId);

      // Clear database
      await this.prisma.accountToken.updateMany({
        where: {
          accountId,
          status: 'active',
        },
        data: {
          supabaseAccessToken: null,
          supabaseRefreshToken: null,
        },
      });

      this.logger.debug(
        `All Supabase tokens invalidated for account: ${accountId}`,
      );
    } catch (error) {
      this.logger.error(`Error invalidating all tokens: ${error.message}`);
    }
  }
}
