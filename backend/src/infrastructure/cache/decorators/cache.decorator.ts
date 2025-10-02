import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_INVALIDATE_METADATA = 'cache_invalidate';

/**
 * Decorator to automatically cache method results
 * @param keyPrefix - Cache key prefix
 * @param ttl - Time to live in seconds (optional)
 */
export const CacheResult = (keyPrefix: string, ttl?: number) =>
  SetMetadata(CACHE_KEY_METADATA, { keyPrefix, ttl });

/**
 * Decorator to set cache TTL for a method
 * @param ttl - Time to live in seconds
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Decorator to invalidate cache patterns after method execution
 * @param patterns - Array of cache key patterns to invalidate
 */
export const InvalidateCache = (patterns: string[]) =>
  SetMetadata(CACHE_INVALIDATE_METADATA, patterns);

/**
 * Decorator for caching content type results
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export const CacheContentType = (ttl = 3600) =>
  CacheResult('content-type', ttl);

/**
 * Decorator for caching content entry results
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export const CacheContentEntry = (ttl = 300) =>
  CacheResult('content-entry', ttl);

/**
 * Decorator for caching query results
 * @param ttl - Time to live in seconds (default: 2 minutes)
 */
export const CacheQuery = (ttl = 120) => CacheResult('query', ttl);

/**
 * Decorator for caching media results
 * @param ttl - Time to live in seconds (default: 30 minutes)
 */
export const CacheMedia = (ttl = 1800) => CacheResult('media', ttl);
