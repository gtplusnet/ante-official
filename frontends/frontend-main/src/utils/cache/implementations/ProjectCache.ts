import { CacheManager, CacheTTL } from '../CacheManager';
import { ProjectDataResponse } from '@shared/response';

export interface ProjectCacheData {
  projects: ProjectDataResponse[];
  totalCount?: number;
  currentPage?: number;
  pagination?: number[];
}

/**
 * Project-specific cache implementation
 *
 * Handles caching for:
 * - Active project lists (for submenu)
 * - All project lists (for grid view)
 * - Individual project details
 */
export class ProjectCacheManager extends CacheManager<ProjectCacheData> {
  protected cachePrefix = 'projectCache';

  /**
   * Get cached project list for active projects (submenu)
   */
  getActiveProjects(accountId: string): ProjectCacheData | null {
    const params = {
      type: 'active',
      status: ['ACTIVE', 'IN_PROGRESS', 'ONGOING'],
      deleted: false,
      lead: false
    };

    return this.get(params, accountId);
  }

  /**
   * Set active projects in cache with 5-minute TTL
   */
  setActiveProjects(
    data: ProjectCacheData,
    accountId: string
  ): void {
    const params = {
      type: 'active',
      status: ['ACTIVE', 'IN_PROGRESS', 'ONGOING'],
      deleted: false,
      lead: false
    };

    this.set(params, data, accountId, CacheTTL.TASK_LIST); // 5 minutes
  }

  /**
   * Get cached project list for grid view (all projects)
   */
  getAllProjects(
    filters: { deleted?: boolean; lead?: boolean },
    page: number,
    accountId: string
  ): ProjectCacheData | null {
    const params = {
      type: 'all',
      deleted: filters.deleted ?? false,
      lead: filters.lead ?? false,
      page
    };

    return this.get(params, accountId);
  }

  /**
   * Set all projects in cache with 5-minute TTL
   */
  setAllProjects(
    filters: { deleted?: boolean; lead?: boolean },
    page: number,
    data: ProjectCacheData,
    accountId: string
  ): void {
    const params = {
      type: 'all',
      deleted: filters.deleted ?? false,
      lead: filters.lead ?? false,
      page
    };

    this.set(params, data, accountId, CacheTTL.TASK_LIST); // 5 minutes
  }

  /**
   * Clear all project-related cache
   */
  clearAllProjects(accountId: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const entry = JSON.parse(cached);
              if (entry.metadata.accountId === accountId) {
                localStorage.removeItem(key);
              }
            } catch {
              // If we can't parse it, skip
            }
          }
        }
      });
    } catch (error) {
      console.error('[ProjectCache] Error clearing all projects:', error);
    }
  }

  /**
   * Invalidate all project caches
   */
  invalidateAll(accountId: string): void {
    this.clear(accountId);
  }
}

// Export singleton instance
export const projectCache = new ProjectCacheManager();