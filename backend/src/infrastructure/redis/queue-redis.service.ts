import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

/**
 * Dedicated Redis service for queue operations with blocking commands.
 * This service maintains a separate connection to Redis specifically for
 * blocking operations (BLPOP, BRPOP, etc.) to prevent them from blocking
 * other Redis operations in the application.
 */
@Injectable()
export class QueueRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueRedisService.name);
  private blockingClient: RedisClientType;

  constructor() {
    // Base socket configuration
    const socketConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      connectTimeout: 10000, // 10 second connection timeout
      reconnectStrategy: (retries) => {
        // Exponential backoff with max 3 second delay
        const delay = Math.min(retries * 100, 3000);
        this.logger.warn(`Reconnecting to Redis (attempt ${retries}) in ${delay}ms`);
        return delay;
      },
    };

    // Add TLS if enabled (must be true, not boolean)
    if (process.env.REDIS_TLS === 'true') {
      socketConfig.tls = true;
    }

    // Create a dedicated client for blocking operations
    this.blockingClient = createClient({
      socket: socketConfig,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'), // Database selection for multi-environment isolation
      // Note: commandTimeout is not available in node-redis v5
      // Blocking operations will use their own timeout parameter
    });

    this.blockingClient.on('error', (err) => {
      this.logger.error('Queue Redis Client Error', err);
    });

    this.blockingClient.on('connect', () => {
      this.logger.log('Queue Redis Client Connected');
    });

    this.blockingClient.on('ready', () => {
      this.logger.log('Queue Redis Client Ready');
    });

    this.blockingClient.on('reconnecting', () => {
      this.logger.warn('Queue Redis Client Reconnecting...');
    });
  }

  async onModuleInit() {
    try {
      await this.blockingClient.connect();
      this.logger.log('Queue Redis connection established for blocking operations');
    } catch (error) {
      this.logger.error('Failed to connect Queue Redis client', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.blockingClient.quit();
      this.logger.log('Queue Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Queue Redis connection', error);
    }
  }

  /**
   * Blocking right pop from a list
   * @param key The key or array of keys to pop from
   * @param timeout Timeout in seconds (0 = infinite)
   * @returns The key and element popped, or null if timeout
   */
  async brpop(
    key: string | string[],
    timeout: number,
  ): Promise<{ key: string; element: string } | null> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      // node-redis v5 API: brPop takes keys array and timeout separately
      const result = await this.blockingClient.brPop(
        keys,
        timeout,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Error in blocking right pop: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  /**
   * Blocking left pop from a list
   * @param key The key or array of keys to pop from
   * @param timeout Timeout in seconds (0 = infinite)
   * @returns The key and element popped, or null if timeout
   */
  async blpop(
    key: string | string[],
    timeout: number,
  ): Promise<{ key: string; element: string } | null> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      // node-redis v5 API: blPop takes keys array and timeout separately
      const result = await this.blockingClient.blPop(
        keys,
        timeout,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Error in blocking left pop: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  /**
   * Blocking right pop from one list and left push to another
   * @param source Source list key
   * @param destination Destination list key
   * @param timeout Timeout in seconds (0 = infinite)
   * @returns The element moved, or null if timeout
   */
  async brpoplpush(
    source: string,
    destination: string,
    timeout: number,
  ): Promise<string | null> {
    try {
      const result = await this.blockingClient.blMove(
        source,
        destination,
        'RIGHT',
        'LEFT',
        timeout,
      );
      return result as string;
    } catch (error: any) {
      this.logger.error(
        `Error in blocking rpoplpush: ${error?.message || String(error)}`,
      );
      return null;
    }
  }

  /**
   * Check if the blocking client is connected
   */
  isConnected(): boolean {
    return this.blockingClient.isOpen;
  }

  /**
   * Get client info for monitoring
   */
  async getClientInfo(): Promise<string> {
    try {
      const info = await this.blockingClient.clientInfo();
      return JSON.stringify(info);
    } catch (error: any) {
      this.logger.error(`Error getting client info: ${error?.message || String(error)}`);
      return '';
    }
  }
}