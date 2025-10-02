/**
 * Centralized Cache Management System
 *
 * Features:
 * - Account-aware caching (automatic invalidation on account switch)
 * - TTL-based expiration (default 24 hours)
 * - Version control for breaking changes
 * - LocalStorage persistence
 * - Automatic cleanup of expired entries
 */

interface CacheMetadata {
  timestamp: number;
  ttl: number;
  version: string;
  accountId: string;
}

interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

// TTL Constants (in milliseconds)
export const CacheTTL = {
  // Short-lived data (changes frequently)
  TASK_LIST: 5 * 60 * 1000,           // 5 minutes

  // Medium-lived data
  TASK_COUNT: 60 * 60 * 1000,         // 1 hour
  NOTIFICATION_COUNT: 60 * 60 * 1000, // 1 hour

  // Long-lived data (relatively stable)
  DASHBOARD_COUNTERS: 24 * 60 * 60 * 1000,  // 24 hours (default)
  USER_PREFERENCES: 24 * 60 * 60 * 1000,    // 24 hours
  COMPANY_SETTINGS: 24 * 60 * 60 * 1000,    // 24 hours
  EMPLOYEE_LIST: 24 * 60 * 60 * 1000,       // 24 hours

  // Very long-lived data (rarely changes)
  STATIC_CONFIG: 7 * 24 * 60 * 60 * 1000,   // 7 days

  // Default
  DEFAULT: 24 * 60 * 60 * 1000              // 24 hours
};

export abstract class CacheManager<T> {
  protected abstract cachePrefix: string;
  protected version = '1.0.0';

  // Global default TTL: 24 hours
  protected static readonly GLOBAL_DEFAULT_TTL = 24 * 60 * 60 * 1000;

  /**
   * Generate a unique cache key including account ID
   */
  protected generateKey(params: any, accountId: string): string {
    const paramString = this.hashParams(params);
    return `${this.cachePrefix}_${accountId}_${paramString}`;
  }

  /**
   * Hash parameters to create a consistent key
   */
  protected hashParams(params: any): string {
    if (!params) return 'default';
    if (typeof params === 'string') return params;

    // Sort keys for consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as any);

    return JSON.stringify(sortedParams).replace(/[^\w]/g, '_');
  }

  /**
   * Check if cache entry is expired
   */
  protected isExpired(metadata: CacheMetadata): boolean {
    const now = Date.now();
    return now - metadata.timestamp > metadata.ttl;
  }

  /**
   * Validate cache entry
   */
  protected isValidEntry<T>(entry: CacheEntry<T> | null, accountId?: string): boolean {
    if (!entry) return false;
    if (entry.metadata.version !== this.version) return false;
    if (this.isExpired(entry.metadata)) return false;
    if (accountId && entry.metadata.accountId !== accountId) return false;
    return true;
  }

  /**
   * Get data from cache
   */
  get(params: any, accountId: string): T | null {
    try {
      const key = this.generateKey(params, accountId);
      const storageKey = this.getStorageKey(key);
      const cached = localStorage.getItem(storageKey);

      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (!this.isValidEntry(entry, accountId)) {
        this.removeKey(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error reading cache:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  set(params: any, data: T, accountId: string, ttl?: number): void {
    try {
      const key = this.generateKey(params, accountId);
      const storageKey = this.getStorageKey(key);

      const entry: CacheEntry<T> = {
        data,
        metadata: {
          timestamp: Date.now(),
          ttl: ttl || CacheTTL.DEFAULT,
          version: this.version,
          accountId
        }
      };

      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error setting cache:`, error);

      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldEntries();
        // Try once more after cleanup
        try {
          const key = this.generateKey(params, accountId);
          const storageKey = this.getStorageKey(key);
          const entry: CacheEntry<T> = {
            data,
            metadata: {
              timestamp: Date.now(),
              ttl: ttl || CacheTTL.DEFAULT,
              version: this.version,
              accountId
            }
          };
          localStorage.setItem(storageKey, JSON.stringify(entry));
        } catch (retryError) {
          console.error(`[${this.cachePrefix}] Failed to cache after cleanup:`, retryError);
        }
      }
    }
  }

  /**
   * Get last updated timestamp for a cache entry
   */
  getLastUpdated(params: any, accountId: string): Date | null {
    try {
      const key = this.generateKey(params, accountId);
      const storageKey = this.getStorageKey(key);
      const cached = localStorage.getItem(storageKey);

      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (!this.isValidEntry(entry, accountId)) return null;

      return new Date(entry.metadata.timestamp);
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error getting last updated:`, error);
      return null;
    }
  }

  /**
   * Clear cache for specific account or all accounts
   */
  clear(accountId?: string): void {
    try {
      const keys = Object.keys(localStorage);
      const prefix = this.cachePrefix;

      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          if (accountId) {
            // Only clear for specific account
            const cached = localStorage.getItem(key);
            if (cached) {
              try {
                const entry: CacheEntry<T> = JSON.parse(cached);
                if (entry.metadata.accountId === accountId) {
                  localStorage.removeItem(key);
                }
              } catch {
                // If we can't parse it, remove it
                localStorage.removeItem(key);
              }
            }
          } else {
            // Clear all for this cache type
            localStorage.removeItem(key);
          }
        }
      });

      console.log(`[${this.cachePrefix}] Cache cleared for account:`, accountId || 'all');
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error clearing cache:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.clear();
  }

  /**
   * Handle account switch
   */
  onAccountSwitch(newAccountId: string, oldAccountId?: string): void {
    console.log(`[${this.cachePrefix}] Account switched from ${oldAccountId} to ${newAccountId}`);
    // Clear cache for old account
    if (oldAccountId) {
      this.clear(oldAccountId);
    }
  }

  /**
   * Clean up old/expired entries
   */
  protected cleanupOldEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const prefix = this.cachePrefix;
      let cleanedCount = 0;

      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CacheEntry<T> = JSON.parse(cached);
              if (entry.metadata && (
                entry.metadata.version !== this.version ||
                this.isExpired(entry.metadata)
              )) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      });

      if (cleanedCount > 0) {
        console.log(`[${this.cachePrefix}] Cleaned ${cleanedCount} old/expired entries`);
      }
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error cleaning old entries:`, error);
    }
  }

  /**
   * Get storage key with prefix
   */
  protected getStorageKey(key: string): string {
    return key; // Key already includes prefix
  }

  /**
   * Remove specific key
   */
  protected removeKey(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`[${this.cachePrefix}] Error removing key:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { count: number; totalSize: number; entries: string[] } {
    const entries: string[] = [];
    let totalSize = 0;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        entries.push(key);
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    });

    return {
      count: entries.length,
      totalSize,
      entries
    };
  }
}

export type { CacheEntry, CacheMetadata };