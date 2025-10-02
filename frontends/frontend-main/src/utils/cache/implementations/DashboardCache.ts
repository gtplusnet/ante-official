import { CacheManager, CacheTTL } from '../CacheManager';

interface LeaveBalance {
  used: number;
  total: number;
}

export interface DashboardCountersData {
  outstandingRequests: number;
  daysBeforeCutoff: number | null;
  sickLeave: LeaveBalance | null;
  vacationLeave: LeaveBalance | null;
}

/**
 * Dashboard-specific cache implementation
 *
 * Handles caching for:
 * - Dashboard counters (24-hour TTL by default)
 * - Widget data
 * - Summary statistics
 */
export class DashboardCacheManager extends CacheManager<DashboardCountersData> {
  protected cachePrefix = 'dashboardCache';

  /**
   * Get cached dashboard counters
   */
  getCounters(accountId: string): DashboardCountersData | null {
    const params = {
      type: 'counters'
    };

    return this.get(params, accountId);
  }

  /**
   * Set dashboard counters in cache with 24-hour TTL (default)
   */
  setCounters(
    data: DashboardCountersData,
    accountId: string,
    ttl?: number
  ): void {
    const params = {
      type: 'counters'
    };

    // Use default TTL (24 hours) if not specified
    this.set(params, data, accountId, ttl || CacheTTL.DASHBOARD_COUNTERS);
  }

  /**
   * Invalidate all dashboard caches
   */
  invalidateAll(accountId: string): void {
    this.clear(accountId);
  }

  /**
   * Check if counters need refresh based on events
   * This can be used to determine if background refresh should be more aggressive
   */
  shouldRefreshCounters(lastEvent?: string): boolean {
    const criticalEvents = [
      'filing-approved',
      'filing-rejected',
      'leave-request-changed',
      'cutoff-date-range-status-updated'
    ];

    return lastEvent ? criticalEvents.includes(lastEvent) : false;
  }
}

// Export singleton instance
export const dashboardCache = new DashboardCacheManager();