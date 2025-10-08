import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AccountDataResponse } from '@shared/response/account.response';

export interface CachedTokenData {
  accountId: string;
  accountInformation: AccountDataResponse;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface CachedSupabaseToken {
  token: string;
  expiresAt: number;
  userId: string;
  accountId: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType; // Main client for cache operations
  private blockingClient: RedisClientType; // Separate client for blocking operations (legacy support)

  constructor() {
    // Base socket configuration
    const socketConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      connectTimeout: 10000, // 10 second connection timeout (TLS handshake needs more time)
      keepAlive: 30000, // Send keep-alive packets every 30 seconds
      noDelay: true, // Disable Nagle's algorithm for low latency
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          this.logger.error(`Redis reconnect failed after ${retries} attempts, giving up`);
          return false; // Stop reconnecting after 10 attempts
        }
        // Exponential backoff with max 5 second delay
        const delay = Math.min(retries * 500, 5000);
        this.logger.warn(`Main Redis reconnecting (attempt ${retries}) in ${delay}ms`);
        return delay;
      },
    };

    // Add TLS if enabled (must be true, not boolean)
    if (process.env.REDIS_TLS === 'true') {
      socketConfig.tls = true;
      socketConfig.servername = process.env.REDIS_HOST; // SNI for TLS
    }

    // Configuration for both clients
    const redisConfig = {
      socket: socketConfig,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'), // Database selection for multi-environment isolation
      // Note: commandTimeout is not available in node-redis v5
    };

    // Main client for all cache operations
    this.client = createClient(redisConfig);

    // Blocking client for legacy support (will be deprecated)
    // Note: QueueRedisService should be used for new blocking operations
    this.blockingClient = createClient(redisConfig);

    // Set up event handlers for main client
    this.client.on('error', (err) => {
      this.logger.error('Redis Main Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Main Client Connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis Main Client Ready');
    });

    // Set up event handlers for blocking client
    this.blockingClient.on('error', (err) => {
      this.logger.error('Redis Blocking Client Error', err);
    });

    this.blockingClient.on('connect', () => {
      this.logger.log('Redis Blocking Client Connected (Legacy)');
    });

    this.blockingClient.on('ready', () => {
      this.logger.log('Redis Blocking Client Ready (Legacy)');
    });
  }

  async onModuleInit() {
    try {
      // Connect both clients
      await Promise.all([
        this.client.connect(),
        this.blockingClient.connect(),
      ]);
      this.logger.log('Redis connections established (main + blocking)');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error; // Re-throw to prevent app from starting with broken Redis
    }
  }

  async onModuleDestroy() {
    try {
      // Close both clients
      await Promise.all([
        this.client.quit(),
        this.blockingClient.quit(),
      ]);
      this.logger.log('Redis connections closed');
    } catch (error) {
      this.logger.error('Error closing Redis connections', error);
    }
  }

  // Auth Token Cache Methods
  private getTokenKey(token: string): string {
    return `auth:token:${token}`;
  }

  private getAccountTokensKey(accountId: string): string {
    return `auth:account:${accountId}:tokens`;
  }

  async cacheTokenData(
    token: string,
    data: CachedTokenData,
    ttl = 86400, // 24 hours default
  ): Promise<void> {
    try {
      const key = this.getTokenKey(token);
      const accountTokensKey = this.getAccountTokensKey(data.accountId);

      // Cache the token data
      await this.client.setEx(key, ttl, JSON.stringify(data));

      // Add token to account's token set for invalidation purposes
      await this.client.sAdd(accountTokensKey, token);
      await this.client.expire(accountTokensKey, ttl);

      this.logger.debug(`Token cached: ${token.substring(0, 8)}...`);
    } catch (error: any) {
      this.logger.error(
        `Error caching token data: ${error?.message || String(error)}`,
      );
    }
  }

  async getCachedTokenData(token: string): Promise<CachedTokenData | null> {
    try {
      const key = this.getTokenKey(token);
      const data = await this.client.get(key);

      if (!data) {
        this.logger.debug(
          `Token not found in cache: ${token.substring(0, 8)}...`,
        );
        return null;
      }

      const parsedData = JSON.parse(data as string) as CachedTokenData;
      this.logger.debug(`Token found in cache: ${token.substring(0, 8)}...`);
      return parsedData;
    } catch (error: any) {
      this.logger.error(
        `Error retrieving cached token data: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async invalidateToken(token: string): Promise<void> {
    try {
      const key = this.getTokenKey(token);

      // Get the cached data to find account ID for cleanup
      const data = await this.getCachedTokenData(token);

      // Remove the token
      await this.client.del(key);

      // Remove from account's token set
      if (data?.accountId) {
        const accountTokensKey = this.getAccountTokensKey(data.accountId);
        await this.client.sRem(accountTokensKey, token);
      }

      this.logger.debug(`Token invalidated: ${token.substring(0, 8)}...`);
    } catch (error: any) {
      this.logger.error(
        `Error invalidating token: ${error?.message || String(error)}`,
      );
    }
  }

  async invalidateAllAccountTokens(accountId: string): Promise<void> {
    try {
      const accountTokensKey = this.getAccountTokensKey(accountId);

      // Get all tokens for this account
      const tokens = await this.client.sMembers(accountTokensKey);

      // Delete all token keys
      if (tokens.length > 0) {
        const tokenKeys = tokens.map((token) => this.getTokenKey(token));
        await this.client.del(tokenKeys);
        this.logger.debug(
          `Invalidated ${tokens.length} tokens for account ${accountId}`,
        );
      }

      // Clear the account tokens set
      await this.client.del(accountTokensKey);
    } catch (error: any) {
      this.logger.error(
        `Error invalidating account tokens: ${error?.message || String(error)}`,
      );
    }
  }

  // Generic Cache Methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error: any) {
      this.logger.error(
        `Error getting cache value: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, data);
      } else {
        await this.client.set(key, data);
      }
    } catch (error: any) {
      this.logger.error(
        `Error setting cache value: ${error?.message || String(error)}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      this.logger.error(
        `Error deleting cache value: ${error?.message || String(error)}`,
      );
    }
  }

  /**
   * Invalidate entity cache by type and ID
   * Standardized method for cache invalidation across services
   */
  async invalidateEntityCache(
    entityType: string,
    entityId: string | number,
  ): Promise<void> {
    const cacheKey = `${entityType}:${entityId}`;
    try {
      await this.del(cacheKey);
      this.logger.debug(`Cache invalidated for ${cacheKey}`);
    } catch (error: any) {
      this.logger.error(
        `Error invalidating cache for ${cacheKey}: ${error?.message || String(error)}`,
      );
      // Don't throw - cache invalidation should not break the main operation
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (error: any) {
      this.logger.error(
        `Error checking key existence: ${error?.message || String(error)}`,
      );
      return false;
    }
  }

  // Health Check
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error: any) {
      this.logger.error(
        `Redis ping failed: ${error?.message || String(error)}`,
      );
      throw error;
    }
  }

  // Statistics
  async getConnectionStats(): Promise<any> {
    try {
      const info = await this.client.info();
      return {
        connected: this.client.isReady,
        info: info,
      };
    } catch (error: any) {
      this.logger.error(
        `Error getting Redis stats: ${error?.message || String(error)}`,
      );
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  // Supabase Token Cache Methods
  private getSupabaseAccessTokenKey(accountId: string): string {
    return `supabase:access:${accountId}`;
  }

  private getSupabaseRefreshTokenKey(accountId: string): string {
    return `supabase:refresh:${accountId}`;
  }

  async cacheSupabaseTokens(
    accountId: string,
    accessToken: string,
    refreshToken: string,
    userId: string,
    accessTokenTTL = 3600, // 1 hour default
    refreshTokenTTL = 2592000, // 30 days default
  ): Promise<void> {
    try {
      const accessTokenData: CachedSupabaseToken = {
        token: accessToken,
        expiresAt: Date.now() + accessTokenTTL * 1000,
        userId,
        accountId,
      };

      const refreshTokenData: CachedSupabaseToken = {
        token: refreshToken,
        expiresAt: Date.now() + refreshTokenTTL * 1000,
        userId,
        accountId,
      };

      // Cache access token
      const accessKey = this.getSupabaseAccessTokenKey(accountId);
      await this.client.setEx(
        accessKey,
        accessTokenTTL,
        JSON.stringify(accessTokenData),
      );

      // Cache refresh token
      const refreshKey = this.getSupabaseRefreshTokenKey(accountId);
      await this.client.setEx(
        refreshKey,
        refreshTokenTTL,
        JSON.stringify(refreshTokenData),
      );

      this.logger.debug(`Supabase tokens cached for account: ${accountId}`);
    } catch (error: any) {
      this.logger.error(
        `Error caching Supabase tokens: ${error?.message || String(error)}`,
      );
    }
  }

  async getCachedSupabaseAccessToken(
    accountId: string,
  ): Promise<CachedSupabaseToken | null> {
    try {
      const key = this.getSupabaseAccessTokenKey(accountId);
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      const tokenData = JSON.parse(data as string) as CachedSupabaseToken;

      // Check if token is expired
      if (tokenData.expiresAt <= Date.now()) {
        this.logger.debug(
          `Supabase access token expired for account: ${accountId}`,
        );
        await this.client.del(key);
        return null;
      }

      return tokenData;
    } catch (error: any) {
      this.logger.error(
        `Error retrieving cached Supabase access token: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async getCachedSupabaseRefreshToken(
    accountId: string,
  ): Promise<CachedSupabaseToken | null> {
    try {
      const key = this.getSupabaseRefreshTokenKey(accountId);
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      const tokenData = JSON.parse(data as string) as CachedSupabaseToken;

      // Check if token is expired
      if (tokenData.expiresAt <= Date.now()) {
        this.logger.debug(
          `Supabase refresh token expired for account: ${accountId}`,
        );
        await this.client.del(key);
        return null;
      }

      return tokenData;
    } catch (error: any) {
      this.logger.error(
        `Error retrieving cached Supabase refresh token: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async invalidateSupabaseTokens(accountId: string): Promise<void> {
    try {
      const accessKey = this.getSupabaseAccessTokenKey(accountId);
      const refreshKey = this.getSupabaseRefreshTokenKey(accountId);

      await this.client.del([accessKey, refreshKey]);

      this.logger.debug(
        `Supabase tokens invalidated for account: ${accountId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error invalidating Supabase tokens: ${error?.message || String(error)}`,
      );
    }
  }

  async updateSupabaseAccessToken(
    accountId: string,
    newAccessToken: string,
    userId: string,
    ttl = 3600,
  ): Promise<void> {
    try {
      const tokenData: CachedSupabaseToken = {
        token: newAccessToken,
        expiresAt: Date.now() + ttl * 1000,
        userId,
        accountId,
      };

      const key = this.getSupabaseAccessTokenKey(accountId);
      await this.client.setEx(key, ttl, JSON.stringify(tokenData));

      this.logger.debug(
        `Supabase access token updated for account: ${accountId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error updating Supabase access token: ${error?.message || String(error)}`,
      );
    }
  }

  // Queue Operations for Lists
  async lpush(key: string, value: any): Promise<number> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.lPush(key, data);
    } catch (error: any) {
      this.logger.error(
        `Error pushing to list (lpush): ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  async rpush(key: string, value: any): Promise<number> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.rPush(key, data);
    } catch (error: any) {
      this.logger.error(
        `Error pushing to list (rpush): ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  /**
   * @deprecated Use QueueRedisService.brpop() instead for blocking operations
   * This method uses a separate client to prevent blocking cache operations
   */
  async brpop(key: string | string[], timeout: number): Promise<{ key: string; element: string } | null> {
    try {
      this.logger.warn('Using deprecated brpop in RedisService. Please migrate to QueueRedisService.');
      const keys = Array.isArray(key) ? key : [key];
      // Use blocking client to prevent blocking main cache operations
      // Note: brPop for right pop (not blPop which is left pop)
      const result = await this.blockingClient.brPop(
        keys,
        timeout,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Error blocking pop from list: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      const value = await this.client.rPop(key);
      return typeof value === 'string' ? value : null;
    } catch (error: any) {
      this.logger.error(
        `Error popping from list: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error: any) {
      this.logger.error(
        `Error getting list length: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error: any) {
      this.logger.error(
        `Error getting list range: ${error?.message || String(error)}`,
      );
      return [];
    }
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    try {
      return await this.client.lRem(key, count, value);
    } catch (error: any) {
      this.logger.error(
        `Error removing from list: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  // Hash Operations for Job Details
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value);
    } catch (error: any) {
      this.logger.error(
        `Error setting hash field: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  async hsetMultiple(key: string, values: Record<string, string>): Promise<number> {
    try {
      return await this.client.hSet(key, values);
    } catch (error: any) {
      this.logger.error(
        `Error setting multiple hash fields: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const value = await this.client.hGet(key, field);
      return typeof value === 'string' ? value : null;
    } catch (error: any) {
      this.logger.error(
        `Error getting hash field: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error: any) {
      this.logger.error(
        `Error getting all hash fields: ${error?.message || String(error)}`,
      );
      return {};
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.client.hDel(key, fields);
    } catch (error: any) {
      this.logger.error(
        `Error deleting hash fields: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    try {
      return await this.client.hIncrBy(key, field, increment);
    } catch (error: any) {
      this.logger.error(
        `Error incrementing hash field: ${error?.message || String(error)}`,
      );
      return 0;
    }
  }

  // Set TTL on a key
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error: any) {
      this.logger.error(
        `Error setting expiry: ${error?.message || String(error)}`,
      );
      return false;
    }
  }
}
