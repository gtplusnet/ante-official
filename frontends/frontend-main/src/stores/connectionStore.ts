import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { useSocketStore } from './socketStore';

interface Connection {
  NAME: string;
  API_URL: string;
  SOCKET_URL: string;
}

const STORAGE_KEY = 'selectedConnection';

export const useConnectionStore = defineStore('connection', {
  state: () => ({
    connections: [
      {
        NAME: 'Default',
        // @ts-ignore - Defined by Quasar rawDefine
        API_URL: __API_URL,
        // @ts-ignore - Defined by Quasar rawDefine
        SOCKET_URL: __SOCKET_URL
      }
    ] as Connection[],
    selectedConnectionName: 'Default',
    connectionsLoaded: false,
  }),

  getters: {
    currentConnection(): Connection {
      return this.connections.find(c => c.NAME === this.selectedConnectionName) || this.connections[0];
    },
    
    apiUrl(): string {
      return this.currentConnection.API_URL;
    },
    
    socketUrl(): string {
      return this.currentConnection.SOCKET_URL;
    },
    
    isDevelopment(): boolean {
      return import.meta.env.VITE_ENVIRONMENT === 'development' || import.meta.env.DEV;
    }
  },

  actions: {
    async loadAdditionalConnections() {
      if (this.connectionsLoaded) return;
      
      try {
        // Try to fetch connections.json from the public directory
        // Using a HEAD request first to check if file exists without logging 404 errors
        const response = await fetch('/connections.json', {
          method: 'GET',
          // Add cache control to prevent unnecessary network requests
          cache: 'default'
        }).catch(() => null);
        
        if (response && response.ok) {
          const additionalConnections = await response.json();
          if (Array.isArray(additionalConnections)) {
            // Add connections that don't already exist
            additionalConnections.forEach((conn: Connection) => {
              if (!this.connections.find(c => c.NAME === conn.NAME)) {
                this.connections.push(conn);
              }
            });
            console.log('Loaded additional connections from connections.json');
          }
        }
      } catch (error) {
        // Silently handle if connections.json doesn't exist or has invalid format
        // This is expected in production/staging environments
      }
      
      this.connectionsLoaded = true;
    },
    
    loadFromStorage() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && this.connections.find(c => c.NAME === saved)) {
        this.selectedConnectionName = saved;
      }
    },
    
    setConnection(connectionName: string) {
      if (!this.connections.find(c => c.NAME === connectionName)) {
        console.error(`Connection "${connectionName}" not found`);
        return;
      }
      
      this.selectedConnectionName = connectionName;
      localStorage.setItem(STORAGE_KEY, connectionName);
      
      // Update axios base URL
      api.defaults.baseURL = this.apiUrl;
      
      // Reconnect socket with new URL
      const socketStore = useSocketStore();
      if (socketStore.socket) {
        socketStore.disconnect();
        // Small delay to ensure clean disconnect
        setTimeout(() => {
          socketStore.initSocket();
        }, 100);
      }
    }
  }
});