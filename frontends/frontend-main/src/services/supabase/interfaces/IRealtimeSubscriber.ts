/**
 * Interface for Supabase realtime subscribers
 * Defines the contract that all realtime services must implement
 */
export interface IRealtimeSubscriber {
  /**
   * Subscribe to realtime changes
   */
  subscribe(): Promise<void>;

  /**
   * Unsubscribe from realtime changes
   */
  unsubscribe(): Promise<void>;

  /**
   * Handle INSERT events
   * @param payload - The inserted record
   */
  onInsert?(payload: any): void;

  /**
   * Handle UPDATE events
   * @param payload - Object containing new and old records
   */
  onUpdate?(payload: { new: any; old: any }): void;

  /**
   * Handle DELETE events
   * @param payload - The deleted record
   */
  onDelete?(payload: any): void;

  /**
   * Check if currently subscribed
   */
  isSubscribed(): boolean;
}

/**
 * Callback functions for realtime events
 */
export interface IRealtimeCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: { new: any; old: any }) => void;
  onDelete?: (payload: any) => void;
}