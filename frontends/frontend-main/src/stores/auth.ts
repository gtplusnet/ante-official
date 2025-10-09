import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { useSocketStore } from './socketStore';
import { openDB } from 'idb';
import { AccountDataResponse } from '@shared/response/account.response';
import { RoleDataResponse } from '@shared/response/role.response';
import { api } from 'src/boot/axios';
import supabaseService from 'src/services/supabase';
import { useProjectStore } from './project';
import { useAssigneeStore } from './assignee';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: LocalStorage.getItem('token') || '',
    accountInformation: (LocalStorage.getItem('accountInformation') || {}) as AccountDataResponse,
    serverName: LocalStorage.getItem('serverName') || 'DEVELOPMENT',
    supabaseSession: null as any,
    supabaseInitialized: false,
  }),

  getters: {
    getAuth: (state) => state.token,
    isAuthenticated: (state) => !!state.token,
    isDeveloper: (state) => state.accountInformation.isDeveloper || false,
    getServerName: (state) => state.serverName,
    hasSupabaseSession: (state) => !!state.supabaseSession,
    isFullyAuthenticated: (state) => !!state.token && state.supabaseInitialized,
    companyData: (state) => state.accountInformation?.company || null,
  },

  actions: {
    async clearLoginData() {
      const oldAccountId = this.accountInformation?.id;

      this.token = '';
      this.accountInformation = {} as AccountDataResponse;
      this.serverName = 'DEVELOPMENT';
      this.supabaseSession = null;
      this.supabaseInitialized = false;

      LocalStorage.remove('token');
      LocalStorage.remove('accountInformation');
      LocalStorage.remove('serverName');

      // Clear Supabase session
      try {
        await supabaseService.signOut();
      } catch (error) {
        console.error('Error clearing Supabase session:', error);
      }

      // Clear IndexedDB cache for GSelect component
      await this.clearSelectCache();

      // Clear global stores (project and assignee data)
      try {
        const projectStore = useProjectStore();
        const assigneeStore = useAssigneeStore();
        projectStore.clearData();
        assigneeStore.clearData();
      } catch (error) {
        console.error('Error clearing global stores:', error);
      }

      // Emit logout event for cache clearing
      this.emitEvent('logout', { accountId: oldAccountId });
    },

    async clearSelectCache() {
      try {
        const db = await openDB('anteSelectCache', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('selectOptions')) {
              db.createObjectStore('selectOptions', { keyPath: 'apiUrl' });
            }
          },
        });

        // Clear all cached select options
        const tx = db.transaction('selectOptions', 'readwrite');
        await tx.objectStore('selectOptions').clear();
        await tx.done;

      } catch (error) {
        console.error('Error clearing select cache:', error);
      }
    },
    storeToken(token: string) {
      this.token = token;
      LocalStorage.set('token', token);
      const socketStore = useSocketStore();
      socketStore.initSocket();
    },
    storeAccountInformation(accountInformation: AccountDataResponse) {
      const oldAccountId = this.accountInformation?.id;
      const newAccountId = accountInformation?.id;

      this.accountInformation = accountInformation;
      LocalStorage.set('accountInformation', accountInformation);

      // Emit account-switched event if account ID changed
      if (oldAccountId && newAccountId && oldAccountId !== newAccountId) {
        this.emitEvent('account-switched', {
          oldAccountId,
          newAccountId
        });
      }
    },
    storeServerName(serverName: string) {
      this.serverName = serverName;
      LocalStorage.set('serverName', serverName);
    },
    
    async refreshAccountInformation() {
      try {
        // Fetch fresh account information from the API
        const response = await api.get('/account/my_account');
        if (response.data) {
          // Update the store and LocalStorage with fresh data
          this.storeAccountInformation(response.data);
          return response.data;
        }
      } catch (error) {
        console.error('Error refreshing account information:', error);
        throw error;
      }
    },
    
    updateAccountInformationFromSocket(accountInformation: AccountDataResponse) {
      // Update account information from socket event without API call
      this.storeAccountInformation(accountInformation);
    },
    
    updateRoleFromSocket(roleData: { roleId: string; role: RoleDataResponse; timestamp: string }) {
      // Update only the role information
      if (this.accountInformation && roleData.roleId === this.accountInformation.roleID) {
        this.accountInformation.role = roleData.role;
        LocalStorage.set('accountInformation', this.accountInformation);
      }
    },

    /**
     * Store Supabase tokens and initialize session
     */
    async storeSupabaseTokens(accessToken?: string, refreshToken?: string) {
      if (!accessToken) {
        this.supabaseInitialized = true; // Mark as initialized even without tokens
        return;
      }

      try {
        const { data, error } = await supabaseService.setSession(accessToken, refreshToken);

        if (error) {
          console.error('🔐 storeSupabaseTokens - Failed to set Supabase session:', error);
          this.supabaseSession = null;
        } else {
          this.supabaseSession = data!.session;
        }
      } catch (error) {
        console.error('🔐 storeSupabaseTokens - Error initializing Supabase session:', error);
      } finally {
        this.supabaseInitialized = true;
      }
    },

    /**
     * Initialize Supabase session from existing tokens
     */
    async initializeSupabaseSession() {
      try {
        // Check if we have an existing Supabase session (from localStorage)
        const { data } = await supabaseService.getSession();

        if (data?.session) {
          this.supabaseSession = data.session;
          this.supabaseInitialized = true;
        } else {
          this.supabaseInitialized = true;
        }
      } catch (error) {
        console.error('🔐 initializeSupabaseSession - Error:', error);
        this.supabaseInitialized = true;
      }
    },

    /**
     * Refresh Supabase session
     */
    async refreshSupabaseSession() {
      try {
        const { data, error } = await supabaseService.refreshSession();
        
        if (error) {
          console.error('Failed to refresh Supabase session:', error);
          return false;
        }
        
        this.supabaseSession = data.session;
        return true;
      } catch (error) {
        console.error('Error refreshing Supabase session:', error);
        return false;
      }
    },

    /**
     * Emit event through the global event bus
     */
    emitEvent(eventName: string, data?: any) {
      // Try to get the event bus from the current app instance
      try {
        // This is a workaround since we're in a store
        const app = getCurrentInstance()?.appContext.app;
        if (app && app.config.globalProperties.$bus) {
          app.config.globalProperties.$bus.emit(eventName, data);
        } else {
          // Fallback: try to get from window if set globally
          if ((window as any).__vueApp__?.config.globalProperties.$bus) {
            (window as any).__vueApp__.config.globalProperties.$bus.emit(eventName, data);
          }
        }
      } catch (error) {
        console.warn(`[Auth Store] Could not emit event '${eventName}':`, error);
      }
    }
  },
});
