import { defineStore } from 'pinia';
import { PettyCashHolderResponse } from 'src/interfaces/petty-cash.interface';

interface PettyCashCache {
  data: PettyCashHolderResponse | null;
  timestamp: number;
  isStale: boolean;
}

export const usePettyCashCacheStore = defineStore('pettyCashCache', {
  state: (): PettyCashCache => ({
    data: null,
    timestamp: 0,
    isStale: false
  }),
  
  getters: {
    hasCachedData: (state) => !!state.data,
    cacheAge: (state) => Date.now() - state.timestamp,
    isCacheValid: (state) => state.data && (Date.now() - state.timestamp) < 5 * 60 * 1000 // 5 minutes
  },
  
  actions: {
    setCacheData(data: PettyCashHolderResponse) {
      this.data = data;
      this.timestamp = Date.now();
      this.isStale = false;
    },
    
    markAsStale() {
      this.isStale = true;
    },
    
    clearCache() {
      this.data = null;
      this.timestamp = 0;
      this.isStale = false;
    }
  }
});