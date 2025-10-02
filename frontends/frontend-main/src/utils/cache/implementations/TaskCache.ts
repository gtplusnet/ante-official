import { CacheManager, CacheTTL } from '../CacheManager';
import { CombinedTaskResponseInterface, TaskCountByStatusResponseInterface } from 'src/shared/interfaces/task.interfaces';

interface TaskListCacheData {
  tasks: CombinedTaskResponseInterface[];
  totalCount?: number;
}

/**
 * Task-specific cache implementation
 *
 * Handles caching for:
 * - Task lists (5-minute TTL)
 * - Task counts (1-hour TTL)
 * - Individual task details
 */
export class TaskCacheManager extends CacheManager<TaskListCacheData | TaskCountByStatusResponseInterface> {
  protected cachePrefix = 'taskCache';

  /**
   * Get cached task list
   */
  getTaskList(
    status: string,
    search: string,
    sortBy: string,
    descending: boolean,
    accountId: string
  ): TaskListCacheData | null {
    const params = {
      type: 'taskList',
      status,
      search: search || 'noSearch',
      sortBy,
      descending
    };

    return this.get(params, accountId) as TaskListCacheData | null;
  }

  /**
   * Set task list in cache with 5-minute TTL
   */
  setTaskList(
    status: string,
    search: string,
    sortBy: string,
    descending: boolean,
    data: TaskListCacheData,
    accountId: string
  ): void {
    const params = {
      type: 'taskList',
      status,
      search: search || 'noSearch',
      sortBy,
      descending
    };

    this.set(params, data, accountId, CacheTTL.TASK_LIST);
  }

  /**
   * Get cached task count
   */
  getTaskCount(accountId: string): TaskCountByStatusResponseInterface | null {
    const params = {
      type: 'taskCount'
    };

    return this.get(params, accountId) as TaskCountByStatusResponseInterface | null;
  }

  /**
   * Set task count in cache with 1-hour TTL
   */
  setTaskCount(
    data: TaskCountByStatusResponseInterface,
    accountId: string
  ): void {
    const params = {
      type: 'taskCount'
    };

    this.set(params, data, accountId, CacheTTL.TASK_COUNT);
  }

  /**
   * Clear all task-related cache for a specific status
   */
  clearByStatus(status: string, accountId: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix) && key.includes(`taskList_${status}`)) {
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
      console.error('[TaskCache] Error clearing by status:', error);
    }
  }

  /**
   * Invalidate all task caches (lists and counts)
   */
  invalidateAll(accountId: string): void {
    this.clear(accountId);
  }
}

// Export singleton instance
export const taskCache = new TaskCacheManager();