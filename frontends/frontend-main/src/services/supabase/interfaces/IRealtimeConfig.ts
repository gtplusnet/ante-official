/**
 * Configuration interface for Supabase realtime subscriptions
 */
export interface IRealtimeConfig {
  /**
   * The database table to subscribe to
   */
  table: string;

  /**
   * The database schema (defaults to 'public')
   */
  schema?: string;

  /**
   * Filter condition for the subscription
   * Example: 'receiverId=eq.123' or 'status=eq.active'
   */
  filter?: string;

  /**
   * Events to listen for (defaults to all)
   */
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];

  /**
   * Custom channel name (optional, auto-generated if not provided)
   */
  channelName?: string;
}

/**
 * Extended configuration with additional options
 */
export interface IRealtimeExtendedConfig extends IRealtimeConfig {
  /**
   * Enable auto-reconnect on connection loss
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts
   */
  maxReconnectAttempts?: number;

  /**
   * Initial delay between reconnection attempts (in ms)
   */
  reconnectDelay?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}