export interface CacheKeyConfig {
  prefix: string;
  companyId?: number;
  type?: string;
  identifier?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  refresh?: boolean; // Force refresh cache
  serialize?: boolean; // Serialize complex objects
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
}

export interface CacheBulkOperation {
  key: string;
  value: any;
  ttl?: number;
}

export interface CMSCacheConfig {
  contentTypes: {
    ttl: number;
    maxItems: number;
  };
  contentEntries: {
    ttl: number;
    maxItems: number;
  };
  queries: {
    ttl: number;
    maxItems: number;
  };
  media: {
    ttl: number;
    maxItems: number;
  };
}

export interface CacheInvalidationPattern {
  pattern: string;
  reason?: string;
  timestamp?: Date;
}

export interface CacheHealthCheck {
  isConnected: boolean;
  latency: number;
  memory: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  keyspace: {
    keys: number;
    expires: number;
    avgTtl: number;
  };
}

export enum CacheEventType {
  HIT = 'hit',
  MISS = 'miss',
  SET = 'set',
  DELETE = 'delete',
  INVALIDATE = 'invalidate',
  ERROR = 'error',
}

export interface CacheEvent {
  type: CacheEventType;
  key: string;
  timestamp: Date;
  companyId?: number;
  metadata?: any;
}
