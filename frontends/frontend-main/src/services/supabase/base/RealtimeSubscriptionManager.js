/**
 * Manages multiple Supabase realtime subscriptions
 * Prevents duplicate subscriptions and handles cleanup
 * Implements Singleton pattern for global subscription management
 */
class RealtimeSubscriptionManager {
  constructor() {
    if (RealtimeSubscriptionManager.instance) {
      return RealtimeSubscriptionManager.instance;
    }

    this.subscriptions = new Map();
    this.subscriberCounts = new Map();
    RealtimeSubscriptionManager.instance = this;
  }

  /**
   * Register a subscription
   * @param {String} key - Unique key for the subscription
   * @param {SupabaseRealtimeService} service - The realtime service instance
   * @returns {SupabaseRealtimeService} The registered service
   */
  register(key, service) {
    if (this.subscriptions.has(key)) {
      // Increment subscriber count for existing subscription
      const currentCount = this.subscriberCounts.get(key) || 0;
      this.subscriberCounts.set(key, currentCount + 1);
      
      console.log(`Reusing existing subscription for ${key}. Subscribers: ${currentCount + 1}`);
      return this.subscriptions.get(key);
    }

    // Register new subscription
    this.subscriptions.set(key, service);
    this.subscriberCounts.set(key, 1);
    
    console.log(`Registered new subscription for ${key}`);
    return service;
  }

  /**
   * Unregister a subscription
   * Only unsubscribes when no more subscribers remain
   * @param {String} key - Unique key for the subscription
   * @returns {Promise<void>}
   */
  async unregister(key) {
    if (!this.subscriptions.has(key)) {
      return;
    }

    const currentCount = this.subscriberCounts.get(key) || 0;
    
    if (currentCount > 1) {
      // Decrement subscriber count
      this.subscriberCounts.set(key, currentCount - 1);
      console.log(`Decreased subscriber count for ${key}. Remaining: ${currentCount - 1}`);
      return;
    }

    // Last subscriber - unsubscribe and remove
    const service = this.subscriptions.get(key);
    if (service) {
      try {
        await service.unsubscribe();
        console.log(`Unsubscribed and removed subscription for ${key}`);
      } catch (error) {
        console.error(`Error unsubscribing ${key}:`, error);
      }
    }

    this.subscriptions.delete(key);
    this.subscriberCounts.delete(key);
  }

  /**
   * Get a subscription by key
   * @param {String} key - Unique key for the subscription
   * @returns {SupabaseRealtimeService|null} The service or null if not found
   */
  get(key) {
    return this.subscriptions.get(key) || null;
  }

  /**
   * Check if a subscription exists
   * @param {String} key - Unique key for the subscription
   * @returns {Boolean} True if subscription exists
   */
  has(key) {
    return this.subscriptions.has(key);
  }

  /**
   * Get all active subscriptions
   * @returns {Map} Map of all subscriptions
   */
  getAll() {
    return new Map(this.subscriptions);
  }

  /**
   * Get subscriber count for a specific subscription
   * @param {String} key - Unique key for the subscription
   * @returns {Number} Number of subscribers
   */
  getSubscriberCount(key) {
    return this.subscriberCounts.get(key) || 0;
  }

  /**
   * Unsubscribe from all subscriptions
   * Useful for cleanup on app shutdown
   * @returns {Promise<void>}
   */
  async unsubscribeAll() {
    const unsubscribePromises = [];
    
    for (const [key, service] of this.subscriptions) {
      unsubscribePromises.push(
        service.unsubscribe().catch((error) => {
          console.error(`Error unsubscribing ${key}:`, error);
        })
      );
    }

    await Promise.all(unsubscribePromises);
    
    this.subscriptions.clear();
    this.subscriberCounts.clear();
    
    console.log('All realtime subscriptions cleared');
  }

  /**
   * Get statistics about current subscriptions
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      totalSubscribers: 0,
      subscriptions: []
    };

    for (const [key, count] of this.subscriberCounts) {
      stats.totalSubscribers += count;
      stats.subscriptions.push({
        key,
        subscribers: count,
        isConnected: this.subscriptions.get(key)?.isSubscribed() || false
      });
    }

    return stats;
  }

  /**
   * Clean up disconnected subscriptions
   * Removes subscriptions that are no longer connected and have no subscribers
   */
  cleanup() {
    const keysToRemove = [];
    
    for (const [key, service] of this.subscriptions) {
      const subscriberCount = this.subscriberCounts.get(key) || 0;
      
      if (!service.isSubscribed() && subscriberCount === 0) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.subscriptions.delete(key);
      this.subscriberCounts.delete(key);
      console.log(`Cleaned up disconnected subscription: ${key}`);
    }

    return keysToRemove.length;
  }
}

// Create and export singleton instance
const subscriptionManager = new RealtimeSubscriptionManager();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.unsubscribeAll().catch(console.error);
  });
}

export default subscriptionManager;