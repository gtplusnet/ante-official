// src/stores/socketStore.ts
import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useConnectionStore } from './connectionStore';
import bus from 'src/bus'; // adjust the path if needed

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null as Socket | null,
    isConnected: false,
    isInitializing: false,
    messageLog: [] as string[],
  }),

  actions: {
    initSocket() {
      const authStore = useAuthStore();
      const connectionStore = useConnectionStore();
      
      if (!authStore.token) {
        console.error('User not authenticated. Cannot initialize socket.');
        return;
      }

      // Prevent concurrent initialization attempts
      if (this.isInitializing) {
        console.log('Socket initialization already in progress, skipping');
        return;
      }

      // Prevent duplicate socket connections - check both connected and connecting states
      if (this.socket) {
        if (this.socket.connected) {
          console.log('Socket already connected, skipping initialization');
          return;
        }
        // Check if socket is in the process of connecting
        // The socket.active property indicates if the socket is actively trying to connect
        if (this.socket.active) {
          console.log('Socket is actively connecting, skipping initialization');
          return;
        }
        // If socket exists but is disconnected and not active, disconnect it properly
        if (this.socket.disconnected && !this.socket.active) {
          console.log('Disconnecting existing disconnected socket before reinitializing');
          this.socket.disconnect();
          this.socket = null;
        }
      }

      // Mark as initializing
      this.isInitializing = true;

      // Use connection store for socket URL in development, otherwise use env
      const environment = process.env.ENVIRONMENT || 'development';
      let SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000';
      
      if (environment === 'development') {
        connectionStore.loadFromStorage();
        SOCKET_URL = connectionStore.socketUrl;
      }

      this.socket = io(`${SOCKET_URL}`, {
        auth: {
          token: authStore.token,
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      this.setupSocketListeners();
    },

    setupSocketListeners() {
      if (!this.socket) return;


      this.socket.on('connect', () => {
        this.isConnected = true;
        this.isInitializing = false;
        this.addMessageToLog('Socket connected');
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.isInitializing = false;
        console.log('Socket disconnected:', reason);
        this.addMessageToLog(`Socket disconnected: ${reason}`);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        this.addMessageToLog(`Socket reconnected after ${attemptNumber} attempts`);
      });

      this.socket.on('error', (error) => {
        this.isInitializing = false;
        this.addMessageToLog(`Socket error: ${error}`);
      });

      this.socket.on('connect_error', (error) => {
        this.isInitializing = false;
        console.log('Socket connection error:', error.message);
        this.addMessageToLog(`Socket connection error: ${error.message}`);
      });

      this.socket.on('cutoff-date-range-status-updated', (data) => {
        bus.emit('cutoff-date-range-status-updated', data);
      });
      
      // New payroll-specific events
      this.socket.on('payroll-cutoff-list-changed', (data) => {
        bus.emit('payroll-cutoff-list-changed', data);
        this.addMessageToLog(`Payroll cutoff list changed: ${data.action} - Cutoff ID: ${data.cutoffDateRangeId}`);
      });
      
      this.socket.on('payroll-cutoff-item-updated', (data) => {
        bus.emit('payroll-cutoff-item-updated', data);
        this.addMessageToLog(`Payroll cutoff item updated: ${data.status} - Cutoff ID: ${data.cutoffDateRangeId}`);
      });
      
      this.socket.on('payroll-queue-progress', (data) => {
        bus.emit('payroll-queue-progress', data);
        this.addMessageToLog(`Payroll queue progress: ${data.status} - Queue ID: ${data.queueId}`);
      });

      // AI Chat events
      this.socket.on('ai_chat_message', (data) => {
        bus.emit('ai_chat_message', data);
        this.addMessageToLog(`AI Chat message received: ${data.message}`);
      });
      
      // Account and Role update events
      this.socket.on('account-updated', (data) => {
        bus.emit('account-updated', data);
        this.addMessageToLog('Account information updated');
      });
      
      this.socket.on('role-updated', (data) => {
        bus.emit('role-updated', data);
        this.addMessageToLog('Role information updated');
      });
      
      this.socket.on('password-changed', (data) => {
        bus.emit('password-changed', data);
        this.addMessageToLog('Password changed notification received');
      });
      
      this.socket.on('account-deactivated', (data) => {
        bus.emit('account-deactivated', data);
        this.addMessageToLog('Account deactivated notification received');
      });
      
      // Task-related events
      this.socket.on('task-changed', (data) => {
        bus.emit('task-changed', data);
        this.addMessageToLog(`Task changed: ${data.action} - Task ID: ${data.taskId}`);
      });
      
      this.socket.on('task-completed', (data) => {
        bus.emit('task-completed', data);
        this.addMessageToLog(`Task completed: Task ID: ${data.taskId}`);
      });
      
      this.socket.on('approval-processed', (data) => {
        bus.emit('approval-processed', data);
        this.addMessageToLog(`Approval processed: Task ID: ${data.taskId}`);
      });
      
      // Filing-related events
      this.socket.on('filing-updated', (data) => {
        bus.emit('filing-updated', data);
        this.addMessageToLog(`Filing updated: ${data.action} - Filing ID: ${data.filingId}`);
      });
      
      this.socket.on('filing-created', (data) => {
        bus.emit('filing-created', data);
        this.addMessageToLog(`Filing created: Filing ID: ${data.filingId}`);
      });
      
      this.socket.on('filing-approved', (data) => {
        bus.emit('filing-approved', data);
        this.addMessageToLog(`Filing approved: Filing ID: ${data.filingId}`);
      });
      
      this.socket.on('filing-rejected', (data) => {
        bus.emit('filing-rejected', data);
        this.addMessageToLog(`Filing rejected: Filing ID: ${data.filingId}`);
      });
      
      // Employee Import events
      this.socket.on('import-progress', (data) => {
        bus.emit('import-progress', data);
        this.addMessageToLog(`Import progress: ${data.stage} - Batch ID: ${data.batchId}`);
      });
      
      // Dynamic discussion event handling
      this.socket.onAny((eventName, data) => {
        if (eventName.startsWith('discussion:')) {
          bus.emit(eventName, data);
          this.addMessageToLog(`Discussion event: ${eventName}`);
        }
      });
      
      // Handle reconnection for discussions
      this.socket.on('reconnect', () => {
        this.addMessageToLog('Socket reconnected, restoring discussion rooms...');
        // Let discussion store handle reconnection
        import('./discussionStore').then(({ useDiscussionStore }) => {
          const discussionStore = useDiscussionStore();
          discussionStore.handleReconnection();
        });
      });
    },

    addMessageToLog(message: string) {
      const logMessage = `${new Date().toISOString()} - ${message}`;
      this.messageLog.push(logMessage);
    },

    disconnect() {
      if (this.socket) {
        // Clean up discussion rooms before disconnecting
        import('./discussionStore').then(({ useDiscussionStore }) => {
          const discussionStore = useDiscussionStore();
          discussionStore.cleanup();
        });
        
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
        this.isInitializing = false;
      }
    },

    // AI Chat methods
    sendAiChatMessage(message: { role: string; content: string; createdAt: string }) {
      if (this.socket && this.isConnected) {
        this.socket.emit('ai_chat_message', {
          message: 'user_message',
          data: message,
        });
        this.addMessageToLog(`AI Chat message sent: ${message.content}`);
        return true;
      } else {
        console.error('Socket not connected. Cannot send AI chat message.');
        return false;
      }
    },
  },
});
