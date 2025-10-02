/**
 * Export all cache implementations as singleton instances
 */

export { taskCache } from './TaskCache';
export { dashboardCache } from './DashboardCache';
export { notificationCache } from './NotificationCache';
export { projectCache } from './ProjectCache';

// Export types
export type { DashboardCountersData } from './DashboardCache';
export type { NotificationCacheData } from './NotificationCache';
export type { ProjectCacheData } from './ProjectCache';

// Re-export common cache utilities
export { CacheManager, CacheTTL } from '../CacheManager';
export type { CacheEntry, CacheMetadata } from '../CacheManager';