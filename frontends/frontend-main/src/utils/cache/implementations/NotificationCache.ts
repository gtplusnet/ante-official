import { CacheManager } from '../CacheManager';
import { NotificationResponse } from '@shared/response';

export interface NotificationCacheData {
  notifications: NotificationResponse[];
  timestamp?: Date;
}

export class NotificationCacheManager extends CacheManager<NotificationCacheData> {
  protected cachePrefix = 'notificationCache';

  /**
   * Get cached notifications
   */
  getNotifications(accountId: string): NotificationCacheData | null {
    return this.get('allNotifications', accountId);
  }

  /**
   * Set notifications in cache
   */
  setNotifications(
    data: NotificationCacheData,
    accountId: string,
    ttl?: number
  ): void {
    this.set('allNotifications', data, accountId, ttl);
  }
}

// Export singleton instance
export const notificationCache = new NotificationCacheManager();