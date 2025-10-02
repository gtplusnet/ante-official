import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './auth';
import bus from 'src/bus';

interface UnreadCountCache {
  count: number;
  lastFetched: Date;
  ttl: number; // Time to live in milliseconds
}

interface DiscussionState {
  unreadCounts: Map<string, UnreadCountCache>;
  joinedRooms: Set<string>;
  pendingBatchRequests: Map<string, Promise<void>>;
  cacheTimeout: number; // 5 minutes default
}

export const useDiscussionStore = defineStore('discussion', {
  state: (): DiscussionState => ({
    unreadCounts: new Map(),
    joinedRooms: new Set(),
    pendingBatchRequests: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  }),

  getters: {
    getUnreadCount: (state) => (discussionId: string): number => {
      const cached = state.unreadCounts.get(discussionId);
      if (!cached) return 0;
      
      // Check if cache is still valid
      const now = new Date();
      const cacheAge = now.getTime() - cached.lastFetched.getTime();
      
      if (cacheAge > cached.ttl) {
        // Cache expired
        return 0;
      }
      
      return cached.count;
    },
    
    isCacheValid: (state) => (discussionId: string): boolean => {
      const cached = state.unreadCounts.get(discussionId);
      if (!cached) return false;
      
      const now = new Date();
      const cacheAge = now.getTime() - cached.lastFetched.getTime();
      
      return cacheAge <= cached.ttl;
    },
  },

  actions: {
    /**
     * Fetch unread count for a single discussion
     */
    async fetchUnreadCount(discussionId: string): Promise<number> {
      try {
        // Check cache first
        if (this.isCacheValid(discussionId)) {
          return this.getUnreadCount(discussionId);
        }

        const response = await api.get(`/discussion/unread-count/${discussionId}`);
        const count = response.data || 0;
        
        // Update cache
        this.unreadCounts.set(discussionId, {
          count,
          lastFetched: new Date(),
          ttl: this.cacheTimeout,
        });
        
        return count;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    },

    /**
     * Fetch unread counts for multiple discussions (batch)
     */
    async fetchUnreadCounts(discussionIds: string[]): Promise<void> {
      if (discussionIds.length === 0) return;
      
      // Filter out discussions with valid cache
      const idsToFetch = discussionIds.filter(id => !this.isCacheValid(id));
      
      if (idsToFetch.length === 0) return;
      
      // Create batch key for deduplication
      const batchKey = idsToFetch.sort().join(',');
      
      // Check if this batch is already being fetched
      if (this.pendingBatchRequests.has(batchKey)) {
        return this.pendingBatchRequests.get(batchKey);
      }
      
      // Create the batch request
      const batchPromise = this.executeBatchFetch(idsToFetch).finally(() => {
        // Clean up pending request
        this.pendingBatchRequests.delete(batchKey);
      });
      
      this.pendingBatchRequests.set(batchKey, batchPromise);
      return batchPromise;
    },

    /**
     * Execute the actual batch fetch
     */
    async executeBatchFetch(discussionIds: string[]): Promise<void> {
      try {
        const response = await api.post('/discussion/unread-counts', {
          discussionIds,
        });
        
        const counts = response.data || {};
        const now = new Date();
        
        // Update cache for all fetched discussions
        discussionIds.forEach(id => {
          this.unreadCounts.set(id, {
            count: counts[id] || 0,
            lastFetched: now,
            ttl: this.cacheTimeout,
          });
        });
      } catch (error) {
        console.error('Error fetching unread counts batch:', error);
        
        // Set all to 0 on error
        const now = new Date();
        discussionIds.forEach(id => {
          this.unreadCounts.set(id, {
            count: 0,
            lastFetched: now,
            ttl: this.cacheTimeout,
          });
        });
      }
    },

    /**
     * Update unread count for a discussion
     */
    updateUnreadCount(discussionId: string, count: number): void {
      this.unreadCounts.set(discussionId, {
        count,
        lastFetched: new Date(),
        ttl: this.cacheTimeout,
      });
    },

    /**
     * Increment unread count (when new message arrives)
     */
    incrementUnreadCount(discussionId: string): void {
      const current = this.getUnreadCount(discussionId);
      this.updateUnreadCount(discussionId, current + 1);
    },

    /**
     * Mark messages as read and reset count
     */
    async markMessagesAsRead(discussionId: string, options?: { upToMessageId?: number; markAll?: boolean }): Promise<void> {
      try {
        await api.post(`/discussion/mark-read/${discussionId}`, options || { markAll: true });
        
        // Reset unread count
        this.updateUnreadCount(discussionId, 0);
        
        // Emit event for other components
        bus.emit(`discussion:${discussionId}:marked-read`, { discussionId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    },

    /**
     * Join a discussion room for socket updates
     */
    joinDiscussionRoom(discussionId: string): void {
      const socketStore = useSocketStore();
      
      if (!this.joinedRooms.has(discussionId) && socketStore.isConnected) {
        socketStore.socket?.emit('join-discussion', { discussionId });
        this.joinedRooms.add(discussionId);
        
        // Set up event listeners for this discussion
        this.setupDiscussionListeners(discussionId);
      }
    },

    /**
     * Leave a discussion room
     */
    leaveDiscussionRoom(discussionId: string): void {
      const socketStore = useSocketStore();
      
      if (this.joinedRooms.has(discussionId) && socketStore.isConnected) {
        socketStore.socket?.emit('leave-discussion', { discussionId });
        this.joinedRooms.delete(discussionId);
        
        // Clean up event listeners
        this.cleanupDiscussionListeners(discussionId);
      }
    },

    /**
     * Set up event listeners for a specific discussion
     */
    setupDiscussionListeners(discussionId: string): void {
      const newMessageHandler = (data: unknown) => {
        this.handleNewMessage(data as { discussionId: string; message: any; senderId: string });
      };
      
      const messagesReadHandler = (data: unknown) => {
        this.handleMessagesRead(data as { discussionId: string; accountId: string; upToMessageId: number });
      };
      
      const unreadCountHandler = (data: unknown) => {
        const typedData = data as { count: number };
        this.updateUnreadCount(discussionId, typedData.count);
      };
      
      // Store handlers for cleanup
      (this as any)[`handler_${discussionId}_new-message`] = newMessageHandler;
      (this as any)[`handler_${discussionId}_messages-read`] = messagesReadHandler;
      (this as any)[`handler_${discussionId}_unread-count`] = unreadCountHandler;
      
      // Listen for events
      bus.on(`discussion:${discussionId}:new-message` as any, newMessageHandler);
      bus.on(`discussion:${discussionId}:messages-read` as any, messagesReadHandler);
      bus.on(`discussion:${discussionId}:unread-count` as any, unreadCountHandler);
    },

    /**
     * Clean up event listeners for a specific discussion
     */
    cleanupDiscussionListeners(discussionId: string): void {
      // Get stored handlers
      const newMessageHandler = (this as any)[`handler_${discussionId}_new-message`];
      const messagesReadHandler = (this as any)[`handler_${discussionId}_messages-read`];
      const unreadCountHandler = (this as any)[`handler_${discussionId}_unread-count`];
      
      if (newMessageHandler) {
        bus.off(`discussion:${discussionId}:new-message` as any, newMessageHandler);
        delete (this as any)[`handler_${discussionId}_new-message`];
      }
      
      if (messagesReadHandler) {
        bus.off(`discussion:${discussionId}:messages-read` as any, messagesReadHandler);
        delete (this as any)[`handler_${discussionId}_messages-read`];
      }
      
      if (unreadCountHandler) {
        bus.off(`discussion:${discussionId}:unread-count` as any, unreadCountHandler);
        delete (this as any)[`handler_${discussionId}_unread-count`];
      }
    },

    /**
     * Handle new message event
     */
    handleNewMessage(data: { discussionId: string; message: any; senderId: string }): void {
      // Don't increment if it's the current user's message
      const authStore = useAuthStore();
      const currentUserId = authStore.accountInformation?.id;
      
      if (data.senderId !== currentUserId) {
        this.incrementUnreadCount(data.discussionId);
      }
    },

    /**
     * Handle messages read event
     */
    handleMessagesRead(data: { discussionId: string; accountId: string; upToMessageId: number }): void {
      // If current user marked as read, reset count
      const authStore = useAuthStore();
      const currentUserId = authStore.accountInformation?.id;
      
      if (data.accountId === currentUserId) {
        this.updateUnreadCount(data.discussionId, 0);
      }
    },

    /**
     * Handle socket reconnection - rejoin all rooms
     */
    async handleReconnection(): Promise<void> {
      const socketStore = useSocketStore();
      
      if (socketStore.isConnected && this.joinedRooms.size > 0) {
        const discussionIds = Array.from(this.joinedRooms);
        
        try {
          await socketStore.socket?.emit('reconnect-discussions', { discussionIds });
          
          // Re-setup listeners
          discussionIds.forEach(id => {
            this.setupDiscussionListeners(id);
          });
          
          // Refresh unread counts
          await this.fetchUnreadCounts(discussionIds);
        } catch (error) {
          console.error('Error reconnecting to discussion rooms:', error);
        }
      }
    },

    /**
     * Clear all cached data
     */
    clearCache(): void {
      this.unreadCounts.clear();
      this.pendingBatchRequests.clear();
    },

    /**
     * Clean up when logging out
     */
    cleanup(): void {
      // Leave all rooms
      const rooms = Array.from(this.joinedRooms);
      rooms.forEach(id => this.leaveDiscussionRoom(id));
      
      // Clear all data
      this.clearCache();
      this.joinedRooms.clear();
    },
  },
});