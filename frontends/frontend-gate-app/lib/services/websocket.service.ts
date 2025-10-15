/**
 * WebSocket Service for Gate App
 * Replaces Supabase Realtime with Socket.IO connection to backend
 */

import { io, Socket } from 'socket.io-client';

// WebSocket URL from environment or default to localhost
const WS_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export interface AttendanceEvent {
  id: string;
  qrCode: string;
  personId: string;
  personName: string;
  personType: 'student' | 'guardian';
  action: 'check_in' | 'check_out';
  timestamp: string;
  deviceId: string | null;
  profilePhoto: string | null;
  companyId: number;
  duration?: string;
}

export interface StatsEvent {
  date: string;
  totalCheckIns: number;
  totalCheckOuts: number;
  studentCheckIns: number;
  guardianCheckIns: number;
  totalRecords: number;
}

export interface SyncEvent {
  type: 'students' | 'guardians';
  count: number;
  lastSyncTime: string;
}

type AttendanceCallback = (data: AttendanceEvent) => void;
type StatsCallback = (data: StatsEvent) => void;
type SyncCallback = (data: SyncEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private companyId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  async connect(companyId: number): Promise<void> {
    if (this.socket?.connected && this.companyId === companyId) {
      console.log('[WebSocket] Already connected to company:', companyId);
      return;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.companyId = companyId;

    try {
      console.log('[WebSocket] Connecting to:', WS_URL);

      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected successfully');
        this.reconnectAttempts = 0;
        this.joinGateRoom();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
        this.reconnectAttempts++;
        this.isConnecting = false;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      });

      this.socket.on('error', (error) => {
        console.error('[WebSocket] Socket error:', error);
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          resolve();
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('[WebSocket] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Join gate room for company-specific updates
   */
  private joinGateRoom(): void {
    if (!this.socket || !this.companyId) return;

    console.log('[WebSocket] Joining gate room for company:', this.companyId);

    this.socket.emit('gate:join-room', { companyId: this.companyId }, (response: any) => {
      if (response?.status === 'joined') {
        console.log('[WebSocket] Successfully joined gate room');
      } else {
        console.error('[WebSocket] Failed to join gate room:', response);
      }
    });
  }

  /**
   * Subscribe to attendance recorded events
   */
  subscribeToAttendance(callback: AttendanceCallback): () => void {
    if (!this.socket) {
      console.error('[WebSocket] Cannot subscribe - not connected');
      return () => {};
    }

    console.log('[WebSocket] Subscribing to attendance events');

    const handler = (data: AttendanceEvent) => {
      console.log('[WebSocket] Received attendance event:', data);
      callback(data);
    };

    this.socket.on('gate:attendance:recorded', handler);

    // Return unsubscribe function
    return () => {
      console.log('[WebSocket] Unsubscribing from attendance events');
      this.socket?.off('gate:attendance:recorded', handler);
    };
  }

  /**
   * Subscribe to stats update events
   */
  subscribeToStats(callback: StatsCallback): () => void {
    if (!this.socket) {
      console.error('[WebSocket] Cannot subscribe - not connected');
      return () => {};
    }

    console.log('[WebSocket] Subscribing to stats events');

    const handler = (data: StatsEvent) => {
      console.log('[WebSocket] Received stats event:', data);
      callback(data);
    };

    this.socket.on('gate:stats:update', handler);

    // Return unsubscribe function
    return () => {
      console.log('[WebSocket] Unsubscribing from stats events');
      this.socket?.off('gate:stats:update', handler);
    };
  }

  /**
   * Subscribe to sync update events
   */
  subscribeToSync(callback: SyncCallback): () => void {
    if (!this.socket) {
      console.error('[WebSocket] Cannot subscribe - not connected');
      return () => {};
    }

    console.log('[WebSocket] Subscribing to sync events');

    const handler = (data: SyncEvent) => {
      console.log('[WebSocket] Received sync event:', data);
      callback(data);
    };

    this.socket.on('gate:sync:update', handler);

    // Return unsubscribe function
    return () => {
      console.log('[WebSocket] Unsubscribing from sync events');
      this.socket?.off('gate:sync:update', handler);
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (!this.socket) return;

    console.log('[WebSocket] Disconnecting...');

    // Leave gate room
    if (this.companyId) {
      this.socket.emit('gate:leave-room', { companyId: this.companyId });
    }

    this.socket.disconnect();
    this.socket = null;
    this.companyId = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current company ID
   */
  getCompanyId(): number | null {
    return this.companyId;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export class for type usage
export default WebSocketService;
