import { defineStore } from 'pinia';
import { useTimekeepingStore } from './timekeeping.store';

interface DashboardCountersData {
  pendingApprovals: {
    current: number;
    total: number;
  };
  daysBeforeCutoff: number | null;
  pendingProcessing: number;
}

interface State {
  counters: DashboardCountersData | null;
  lastFetchTime: Date | null;
  isInitialLoad: boolean;
}

export const useManpowerDashboardStore = defineStore('manpowerDashboard', {
  state: (): State => ({
    counters: null,
    lastFetchTime: null,
    isInitialLoad: true,
  }),

  getters: {
    pendingApprovalsDisplay(state): string {
      if (!state.counters) return '0 of 0';
      const { current, total } = state.counters.pendingApprovals;
      return `${current} of ${total}`;
    },

    daysBeforeCutoffDisplay(): string {
      // Get the minimum days remaining from timekeeping store for accurate display
      const timekeepingStore = useTimekeepingStore();
      const activeCutoffs = timekeepingStore.timekeepingDateRange.filter(cutoff => 
        cutoff.dateRangeStatus === 'Current'
      );

      if (activeCutoffs.length === 0) {
        return 'No active cutoff';
      }

      // Calculate minimum days remaining
      let minDays = Infinity;
      const today = new Date();

      for (const cutoff of activeCutoffs) {
        if (cutoff.processingDate?.dateFull) {
          const processingDate = new Date(cutoff.processingDate.dateFull);
          const diffTime = processingDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, diffDays);
          
          if (daysRemaining < minDays) {
            minDays = daysRemaining;
          }
        }
      }

      return minDays === Infinity ? 'No active cutoff' : minDays.toString();
    },

    pendingProcessingDisplay(state): string {
      if (!state.counters) return '0';
      return state.counters.pendingProcessing.toString();
    },
  },

  actions: {
    async fetchCounters($api: any) {
      try {
        const response = await $api.get('/hr-filing/dashboard-counters');
        this.counters = response.data;
        this.lastFetchTime = new Date();
        this.isInitialLoad = false;
        
        
        // Save to localStorage for persistence
        localStorage.setItem('manpower-dashboard', JSON.stringify({
          counters: this.counters,
          lastFetchTime: this.lastFetchTime,
        }));
      } catch (error) {
        console.error('Error fetching dashboard counters:', error);
        throw error;
      }
    },
    
    loadFromStorage() {
      const stored = localStorage.getItem('manpower-dashboard');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.counters = data.counters;
          this.lastFetchTime = data.lastFetchTime ? new Date(data.lastFetchTime) : null;
        } catch (error) {
          console.error('Error loading from storage:', error);
        }
      }
    },
    
    clearCache() {
      localStorage.removeItem('manpower-dashboard');
      this.counters = null;
      this.lastFetchTime = null;
      this.isInitialLoad = true;
    },
  },
});