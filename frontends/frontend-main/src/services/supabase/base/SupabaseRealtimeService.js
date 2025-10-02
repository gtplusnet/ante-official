import supabaseService from '../../supabase';

/**
 * Base class for Supabase realtime subscriptions
 * Implements SOLID principles for extensible realtime functionality
 */
export class SupabaseRealtimeService {
  constructor() {
    this.subscription = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onInsert: null,
      onUpdate: null,
      onDelete: null,
    };
  }

  /**
   * Get configuration for the realtime subscription
   * Must be implemented by subclasses
   * @returns {Object} Configuration object with table, schema, filter, events
   */
  getConfig() {
    throw new Error('getConfig must be implemented by subclass');
  }

  /**
   * Transform payload from Supabase to application format
   * Can be overridden by subclasses for custom transformation
   * @param {String} eventType - The type of event (INSERT, UPDATE, DELETE)
   * @param {Object} payload - Raw payload from Supabase
   * @returns {Object} Transformed payload
   */
  transformPayload(eventType, payload) {
    return payload;
  }

  /**
   * Set callbacks for realtime events
   * @param {Object} callbacks - Object with callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Subscribe to realtime changes
   * @returns {Promise<void>}
   */
  async subscribe() {
    try {
      const client = supabaseService.getClient();
      if (!client) {
        throw new Error('Supabase client not initialized');
      }

      const config = this.getConfig();
      if (!config.table) {
        throw new Error('Table name is required for realtime subscription');
      }

      // Unsubscribe from existing subscription if any
      await this.unsubscribe();

      // Create channel name based on table and filter
      const channelName = this.createChannelName(config);
      
      // Initialize the channel
      this.channel = client.channel(channelName);

      // Build the subscription chain
      let subscription = this.channel;

      // Configure postgres changes listener
      const postgresConfig = {
        event: '*',
        schema: config.schema || 'public',
        table: config.table,
      };

      // Add filter if provided
      if (config.filter) {
        postgresConfig.filter = config.filter;
      }

      // Add event-specific listeners
      // const events = config.events || ['INSERT', 'UPDATE', 'DELETE']; // Currently unused
      
      subscription = subscription.on(
        'postgres_changes',
        postgresConfig,
        (payload) => {
          this.handleRealtimeEvent(payload);
        }
      );

      // Handle connection state changes
      subscription
        .on('subscribe', (status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`Realtime subscribed to ${config.table}`);
            if (this.callbacks.onConnect) {
              this.callbacks.onConnect();
            }
          }
        })
        .on('error', (error) => {
          console.error(`Realtime error for ${config.table}:`, error);
          this.handleError(error);
        });

      // Subscribe to the channel
      await subscription.subscribe();
      
      this.subscription = subscription;
    } catch (error) {
      console.error('Failed to subscribe to realtime:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Unsubscribe from realtime changes
   * @returns {Promise<void>}
   */
  async unsubscribe() {
    if (this.channel) {
      try {
        const client = supabaseService.getClient();
        if (client) {
          await client.removeChannel(this.channel);
        }
      } catch (error) {
        console.error('Error unsubscribing from realtime:', error);
      }
      
      this.channel = null;
      this.subscription = null;
      this.isConnected = false;
      
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    }
  }

  /**
   * Handle realtime event from Supabase
   * @private
   * @param {Object} payload - Event payload from Supabase
   */
  handleRealtimeEvent(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    try {
      let transformedPayload;
      let callbackName;

      switch (eventType) {
        case 'INSERT':
          transformedPayload = this.transformPayload('INSERT', newRecord);
          callbackName = 'onInsert';
          break;
        case 'UPDATE':
          transformedPayload = this.transformPayload('UPDATE', { new: newRecord, old: oldRecord });
          callbackName = 'onUpdate';
          break;
        case 'DELETE':
          transformedPayload = this.transformPayload('DELETE', oldRecord);
          callbackName = 'onDelete';
          break;
        default:
          console.warn('Unknown event type:', eventType);
          return;
      }

      if (this.callbacks[callbackName]) {
        this.callbacks[callbackName](transformedPayload);
      }
    } catch (error) {
      console.error('Error handling realtime event:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle errors and attempt reconnection
   * @private
   * @param {Error} error - Error object
   */
  handleError(error) {
    this.isConnected = false;
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }

    // Attempt reconnection with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.subscribe().catch((err) => {
          console.error('Reconnection failed:', err);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Create a unique channel name for the subscription
   * @private
   * @param {Object} config - Configuration object
   * @returns {String} Channel name
   */
  createChannelName(config) {
    const parts = ['realtime', config.schema || 'public', config.table];
    
    if (config.filter) {
      // Add a hash of the filter to make the channel name unique
      const filterHash = this.hashString(config.filter);
      parts.push(filterHash);
    }
    
    return parts.join(':');
  }

  /**
   * Simple hash function for creating unique channel names
   * @private
   * @param {String} str - String to hash
   * @returns {String} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if the service is currently connected
   * @returns {Boolean} Connection status
   */
  isSubscribed() {
    return this.isConnected;
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnection() {
    this.reconnectAttempts = 0;
  }
}