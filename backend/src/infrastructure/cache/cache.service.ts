import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: any;
  expiry?: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  // Generic cache methods
  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry = { value };
    if (ttl && ttl > 0) {
      entry.expiry = Date.now() + ttl * 1000; // Convert seconds to milliseconds
    }
    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async reset(): Promise<void> {
    this.cache.clear();
  }

  // CMS-specific cache methods
  getCMSKey(companyId: number, type: string, identifier: string): string {
    return `cms:${companyId}:${type}:${identifier}`;
  }

  // Content Type caching
  async getContentType(companyId: number, name: string): Promise<any> {
    const key = this.getCMSKey(companyId, 'types', name);
    return this.get(key);
  }

  async setContentType(
    companyId: number,
    name: string,
    data: any,
    ttl = 3600,
  ): Promise<void> {
    const key = this.getCMSKey(companyId, 'types', name);
    await this.set(key, data, ttl);
  }

  async invalidateContentType(companyId: number, name?: string): Promise<void> {
    if (name) {
      const key = this.getCMSKey(companyId, 'types', name);
      await this.del(key);
    } else {
      // Clear all content types for company
      await this.clearPattern(`cms:${companyId}:types:*`);
    }
  }

  // Content Entry caching
  async getContentEntry(
    companyId: number,
    contentType: string,
    entryId: string,
  ): Promise<any> {
    const key = this.getCMSKey(companyId, `content:${contentType}`, entryId);
    return this.get(key);
  }

  async setContentEntry(
    companyId: number,
    contentType: string,
    entryId: string,
    data: any,
    ttl = 300,
  ): Promise<void> {
    const key = this.getCMSKey(companyId, `content:${contentType}`, entryId);
    await this.set(key, data, ttl);
  }

  async invalidateContentEntry(
    companyId: number,
    contentType: string,
    entryId?: string,
  ): Promise<void> {
    if (entryId) {
      const key = this.getCMSKey(companyId, `content:${contentType}`, entryId);
      await this.del(key);
    } else {
      // Clear all entries for content type
      await this.clearPattern(`cms:${companyId}:content:${contentType}:*`);
    }
  }

  // Query result caching
  async getQueryResult(
    companyId: number,
    contentType: string,
    queryHash: string,
  ): Promise<any> {
    const key = this.getCMSKey(companyId, `query:${contentType}`, queryHash);
    return this.get(key);
  }

  async setQueryResult(
    companyId: number,
    contentType: string,
    queryHash: string,
    data: any,
    ttl = 120,
  ): Promise<void> {
    const key = this.getCMSKey(companyId, `query:${contentType}`, queryHash);
    await this.set(key, data, ttl);
  }

  async invalidateQueries(
    companyId: number,
    contentType: string,
  ): Promise<void> {
    await this.clearPattern(`cms:${companyId}:query:${contentType}:*`);
  }

  // Media caching
  async getMedia(companyId: number, mediaId: string): Promise<any> {
    const key = this.getCMSKey(companyId, 'media', mediaId);
    return this.get(key);
  }

  async setMedia(
    companyId: number,
    mediaId: string,
    data: any,
    ttl = 1800,
  ): Promise<void> {
    const key = this.getCMSKey(companyId, 'media', mediaId);
    await this.set(key, data, ttl);
  }

  async invalidateMedia(companyId: number, mediaId?: string): Promise<void> {
    if (mediaId) {
      const key = this.getCMSKey(companyId, 'media', mediaId);
      await this.del(key);
    } else {
      await this.clearPattern(`cms:${companyId}:media:*`);
    }
  }

  // Pattern-based cache clearing
  async clearPattern(pattern: string): Promise<void> {
    // Convert Redis pattern to JavaScript RegExp
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  // Cache statistics and health
  async getStats(): Promise<any> {
    return {
      type: 'memory',
      keys: this.cache.size,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  // Utility method to generate cache key from query parameters
  generateQueryHash(params: any): string {
    return Buffer.from(JSON.stringify(params)).toString('base64');
  }

  // Bulk operations
  async mget(keys: string[]): Promise<any[]> {
    try {
      return await Promise.all(keys.map((key) => this.get(key)));
    } catch (error) {
      console.warn('Failed to get multiple cache keys:', error);
      return new Array(keys.length).fill(undefined);
    }
  }

  async mset(
    keyValuePairs: { key: string; value: any; ttl?: number }[],
  ): Promise<void> {
    try {
      await Promise.all(
        keyValuePairs.map(({ key, value, ttl }) => this.set(key, value, ttl)),
      );
    } catch (error) {
      console.warn('Failed to set multiple cache keys:', error);
    }
  }
}
