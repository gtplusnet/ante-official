import { SupabaseRealtimeService } from '../base/SupabaseRealtimeService';
import { useAuthStore } from 'src/stores/auth';

/**
 * Notification-specific realtime service
 * Extends base service with notification-specific logic
 */
export class NotificationRealtimeService extends SupabaseRealtimeService {
  constructor() {
    super();
    this.accountId = null;
  }

  /**
   * Get configuration for notification realtime subscription
   * @returns {Object} Configuration for AccountNotifications table
   */
  getConfig() {
    // Get current user's ID from auth store
    const authStore = useAuthStore();
    this.accountId = authStore.accountInformation?.id;

    if (!this.accountId) {
      throw new Error('User not authenticated - cannot subscribe to notifications');
    }

    return {
      table: 'AccountNotifications',
      schema: 'public',
      filter: `receiverId=eq.${this.accountId}`,
      events: ['INSERT', 'UPDATE', 'DELETE']
    };
  }

  /**
   * Transform Supabase payload to match application's NotificationResponse format
   * @param {String} eventType - The type of event
   * @param {Object} payload - Raw payload from Supabase
   * @returns {Object} Transformed notification response
   */
  transformPayload(eventType, payload) {
    if (eventType === 'UPDATE') {
      // For UPDATE events, we get both new and old records
      return this.transformNotificationRecord(payload.new);
    }
    
    // For INSERT and DELETE, transform the single record
    return this.transformNotificationRecord(payload);
  }

  /**
   * Transform a raw database record to NotificationResponse format
   * @private
   * @param {Object} record - Raw database record
   * @returns {Object} Notification response object
   */
  transformNotificationRecord(record) {
    if (!record) return null;

    // Note: The full notification data with joins would need to be fetched
    // This transformation handles the basic AccountNotifications data
    // The full data (with sender info, notification content) should be fetched via API
    return {
      id: record.id?.toString(),
      hasRead: record.hasRead || false,
      receiverId: record.receiverId,
      senderId: record.senderId,
      projectId: record.projectId,
      notificationsId: record.notificationsId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isDeleted: record.isDeleted || false,
      // These fields need to be populated by fetching full data
      notificationData: null,
      notificationSender: null,
      project: null
    };
  }

  /**
   * Handle INSERT event - fetch full notification data
   * @param {Object} payload - The inserted record
   * @returns {Object} Object with action type and notification ID
   */
  handleInsert(payload) {
    return {
      action: 'FETCH_NEW',
      notificationId: payload.id,
      data: payload
    };
  }

  /**
   * Handle UPDATE event - update local state
   * @param {Object} payload - The updated record
   * @returns {Object} Object with action type and updated data
   */
  handleUpdate(payload) {
    return {
      action: 'UPDATE_EXISTING',
      notificationId: payload.id,
      data: payload
    };
  }

  /**
   * Handle DELETE event - remove from local state
   * @param {Object} payload - The deleted record
   * @returns {Object} Object with action type and notification ID
   */
  handleDelete(payload) {
    return {
      action: 'REMOVE',
      notificationId: payload.id,
      data: payload
    };
  }

  /**
   * Override base class event handling to provide notification-specific logic
   * @param {String} eventType - The type of event
   * @param {Object} payload - Event payload
   * @returns {Object} Processed event data
   */
  processEvent(eventType, payload) {
    const transformed = this.transformPayload(eventType, payload);
    
    switch (eventType) {
      case 'INSERT':
        return this.handleInsert(transformed);
      case 'UPDATE':
        return this.handleUpdate(transformed);
      case 'DELETE':
        return this.handleDelete(transformed);
      default:
        return transformed;
    }
  }

  /**
   * Subscribe with notification-specific setup
   * @returns {Promise<void>}
   */
  async subscribe() {
    // Ensure user is authenticated before subscribing
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated || !authStore.supabaseSession) {
      throw new Error('Cannot subscribe to notifications: User not authenticated or no Supabase session');
    }

    // Call parent subscribe method
    await super.subscribe();
    
    console.log(`Subscribed to notifications for user ${this.accountId}`);
  }

  /**
   * Get subscription key for this service
   * Used by subscription manager to prevent duplicates
   * @returns {String} Unique subscription key
   */
  getSubscriptionKey() {
    return `notifications:${this.accountId}`;
  }

  /**
   * Check if a notification belongs to current user
   * @param {Object} notification - Notification object
   * @returns {Boolean} True if notification belongs to current user
   */
  isOwnNotification(notification) {
    return notification.receiverId === this.accountId;
  }

  /**
   * Filter notifications to only include user's own
   * Security layer in case RLS policies fail
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Filtered notifications
   */
  filterOwnNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.filter(n => this.isOwnNotification(n));
  }
}