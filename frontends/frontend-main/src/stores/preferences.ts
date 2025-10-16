import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { get, set, merge } from 'lodash-es';

// TypeScript interfaces for type safety
export interface CalendarPreferences {
  enabledSources: string[];
}

export interface UserPreferences {
  calendar?: CalendarPreferences;
  // Future modules can add their preference interfaces here
  // dashboard?: DashboardPreferences;
  // tasks?: TaskPreferences;
}

/**
 * Default preferences structure
 * Matches backend defaults
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  calendar: {
    enabledSources: [], // Empty array = all unchecked by default
  },
};

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    preferences: {} as UserPreferences,
    loading: false,
    loaded: false,
    saveTimeout: null as ReturnType<typeof setTimeout> | null,
  }),

  getters: {
    /**
     * Check if preferences have been loaded
     */
    isLoaded: (state) => state.loaded,

    /**
     * Get calendar preferences
     */
    calendarPreferences: (state): CalendarPreferences => {
      return state.preferences.calendar || DEFAULT_PREFERENCES.calendar!;
    },
  },

  actions: {
    /**
     * Fetch all user preferences from backend
     * Called during splash screen initialization
     */
    async fetchPreferences() {
      if (this.loading) return; // Prevent multiple simultaneous requests

      this.loading = true;

      try {
        const response = await api.get('/account/preferences');

        // Merge with defaults to ensure all keys exist
        this.preferences = merge({}, DEFAULT_PREFERENCES, response.data || {});
        this.loaded = true;

        console.log('[PreferencesStore] Preferences loaded:', this.preferences);
      } catch (error) {
        console.error('[PreferencesStore] Error fetching preferences:', error);

        // Use defaults on error
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.loaded = true; // Still mark as loaded to prevent blocking
      } finally {
        this.loading = false;
      }
    },

    /**
     * Get a preference by key path (supports dot notation)
     * Example: getPreference('calendar.enabledSources', [])
     */
    getPreference<T = any>(key: string, defaultValue: T): T {
      const value = get(this.preferences, key, defaultValue);
      return value !== undefined ? value : defaultValue;
    },

    /**
     * Update a specific preference by key path
     * Auto-saves to backend with debouncing (500ms)
     */
    async updatePreference(key: string, value: any) {
      // Update local state immediately for UI responsiveness
      const updatedPreferences = { ...this.preferences };
      set(updatedPreferences, key, value);
      this.preferences = updatedPreferences;

      // Debounce backend save (prevent too many API calls)
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      this.saveTimeout = setTimeout(async () => {
        try {
          // URL encode the key to handle dot notation (e.g., calendar.enabledSources)
          const encodedKey = encodeURIComponent(key);
          await api.put(`/account/preferences/${encodedKey}`, { value });
          console.log(`[PreferencesStore] Saved preference: ${key}`);
        } catch (error) {
          console.error(`[PreferencesStore] Error saving preference ${key}:`, error);
        }
      }, 500); // 500ms debounce
    },

    /**
     * Bulk update multiple preferences
     * Deep merges with existing preferences
     */
    async bulkUpdatePreferences(preferences: Partial<UserPreferences>) {
      // Update local state
      this.preferences = merge({}, this.preferences, preferences);

      // Save to backend immediately (no debounce for bulk updates)
      try {
        await api.post('/account/preferences/bulk', { preferences });
        console.log('[PreferencesStore] Bulk preferences saved');
      } catch (error) {
        console.error('[PreferencesStore] Error saving bulk preferences:', error);
      }
    },

    /**
     * Reset preferences to defaults
     */
    async resetPreferences() {
      try {
        await api.post('/account/preferences/reset');
        this.preferences = { ...DEFAULT_PREFERENCES };
        console.log('[PreferencesStore] Preferences reset to defaults');
      } catch (error) {
        console.error('[PreferencesStore] Error resetting preferences:', error);
      }
    },

    /**
     * Clear preferences from store
     * Called on logout
     */
    clearPreferences() {
      this.preferences = {} as UserPreferences;
      this.loaded = false;

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }

      console.log('[PreferencesStore] Preferences cleared');
    },
  },
});
