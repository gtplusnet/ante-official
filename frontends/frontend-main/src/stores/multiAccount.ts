import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { AccountDataResponse } from '@shared/response/account.response';
import { useAuthStore } from './auth';
import { getCurrentInstance } from 'vue';

interface StoredAccount {
  token: string;
  accountInformation: AccountDataResponse;
  lastActive: string;
  isImpersonating?: boolean; // True if this account was added via "login as user"
  supabaseToken?: string; // Supabase access token
  supabaseRefreshToken?: string; // Supabase refresh token
}

interface MultiAccountState {
  accounts: StoredAccount[];
  activeAccountId: string | null;
}

export const useMultiAccountStore = defineStore('multiAccount', {
  state: (): MultiAccountState => ({
    accounts: LocalStorage.getItem('multiAccounts') || [],
    activeAccountId: LocalStorage.getItem('activeAccountId') || null,
  }),

  getters: {
    activeAccount: (state): StoredAccount | undefined => {
      return state.accounts.find(acc => acc.accountInformation.id === state.activeAccountId);
    },
    
    allAccounts: (state): StoredAccount[] => {
      return state.accounts.sort((a, b) => 
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );
    },
    
    accountCount: (state): number => {
      return state.accounts.length;
    },
    
    hasMultipleAccounts: (state): boolean => {
      return state.accounts.length > 1;
    },
    
    isImpersonating: (state): boolean => {
      const active = state.accounts.find(acc => acc.accountInformation.id === state.activeAccountId);
      return active?.isImpersonating || false;
    },
  },

  actions: {
    addAccount(
      token: string,
      accountInformation: AccountDataResponse,
      isImpersonating = false,
      supabaseToken?: string,
      supabaseRefreshToken?: string
    ) {
      // Check if account already exists
      const existingIndex = this.accounts.findIndex(
        acc => acc.accountInformation.id === accountInformation.id
      );

      const newAccount: StoredAccount = {
        token,
        accountInformation,
        lastActive: new Date().toISOString(),
        isImpersonating,
        ...(supabaseToken && { supabaseToken }),
        ...(supabaseRefreshToken && { supabaseRefreshToken }),
      };

      if (existingIndex !== -1) {
        // Update existing account
        this.accounts[existingIndex] = newAccount;
      } else {
        // Add new account
        this.accounts.push(newAccount);
      }

      // Set as active account
      this.activeAccountId = accountInformation.id;

      // Persist to LocalStorage
      this.saveToLocalStorage();

      // Update auth store with new active account (don't await here)
      this.syncAuthStore();
    },

    async switchAccount(accountId: string) {
      const account = this.accounts.find(acc => acc.accountInformation.id === accountId);

      if (!account) {
        console.error('Account not found:', accountId);
        return false;
      }

      // Store old account ID before switching
      const oldAccountId = this.activeAccountId;

      // Update last active time
      account.lastActive = new Date().toISOString();

      // Set as active account
      this.activeAccountId = accountId;

      // Persist changes
      this.saveToLocalStorage();

      // Emit account-switched event BEFORE updating auth store
      // This ensures caches are cleared before new data loads
      if (oldAccountId && oldAccountId !== accountId) {
        this.emitEvent('account-switched', {
          oldAccountId,
          newAccountId: accountId
        });
      }

      // Update auth store
      await this.syncAuthStore();

      return true;
    },

    removeAccount(accountId: string) {
      const index = this.accounts.findIndex(acc => acc.accountInformation.id === accountId);
      
      if (index === -1) {
        console.error('Account not found:', accountId);
        return false;
      }

      // Remove account
      this.accounts.splice(index, 1);
      
      // If removed account was active, switch to another account or clear
      if (this.activeAccountId === accountId) {
        if (this.accounts.length > 0) {
          // Switch to most recently active account
          this.activeAccountId = this.accounts[0].accountInformation.id;
          this.syncAuthStore();
        } else {
          // No accounts left
          this.activeAccountId = null;
          this.clearAuthStore();
        }
      }
      
      // Persist changes
      this.saveToLocalStorage();
      
      return true;
    },

    removeAllAccounts() {
      this.accounts = [];
      this.activeAccountId = null;
      this.saveToLocalStorage();
      this.clearAuthStore();
    },

    async syncAuthStore() {
      const authStore = useAuthStore();
      const activeAccount = this.activeAccount;

      if (activeAccount) {
        authStore.storeToken(activeAccount.token);
        authStore.storeAccountInformation(activeAccount.accountInformation);

        // Restore Supabase session if tokens are available
        if (activeAccount.supabaseToken && activeAccount.supabaseRefreshToken) {
          await authStore.storeSupabaseTokens(
            activeAccount.supabaseToken,
            activeAccount.supabaseRefreshToken
          );
        }
      }
    },

    clearAuthStore() {
      const authStore = useAuthStore();
      authStore.clearLoginData();
    },

    saveToLocalStorage() {
      LocalStorage.set('multiAccounts', this.accounts);
      LocalStorage.set('activeAccountId', this.activeAccountId);
    },

    async loadFromLocalStorage() {
      const accounts = LocalStorage.getItem('multiAccounts');
      const activeAccountId = LocalStorage.getItem('activeAccountId');

      if (accounts && Array.isArray(accounts)) {
        this.accounts = accounts;
      }

      if (activeAccountId && typeof activeAccountId === 'string') {
        this.activeAccountId = activeAccountId;
      }

      // Sync with auth store on load
      if (this.activeAccount) {
        await this.syncAuthStore();
      }
    },
    
    async refreshAccountData(accountId: string) {
      const accountIndex = this.accounts.findIndex(acc => acc.accountInformation.id === accountId);
      if (accountIndex === -1) return;
      
      const authStore = useAuthStore();
      const currentToken = authStore.token;
      const account = this.accounts[accountIndex];
      
      try {
        // Temporarily set token for this account
        authStore.storeToken(account.token);
        
        // Fetch fresh account data
        const freshData = await authStore.refreshAccountInformation();
        
        if (freshData) {
          // Update the stored account with fresh data
          this.accounts[accountIndex] = {
            ...account,
            accountInformation: freshData
          };
          
          // Save to local storage
          this.saveToLocalStorage();
          
          // If this is the active account, update auth store
          if (accountId === this.activeAccountId) {
            authStore.storeAccountInformation(freshData);
          }
        }
      } catch (error) {
        console.error(`Failed to refresh account data for ${accountId}:`, error);
      } finally {
        // Restore original token
        authStore.storeToken(currentToken);
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
        console.warn(`[MultiAccount Store] Could not emit event '${eventName}':`, error);
      }
    },
  },
});