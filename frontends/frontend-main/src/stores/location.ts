import { defineStore } from 'pinia';
import { GeolocationService, GeolocationData } from 'src/services/geolocation.service';

const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useLocationStore = defineStore('location', {
  state: () => ({
    currentLocation: null as GeolocationData | null,
    lastUpdated: null as Date | null,
    isTracking: false,
    permissionStatus: 'prompt' as PermissionState | 'unsupported',
    updateIntervalId: null as number | null,
  }),

  getters: {
    hasLocation: (state) => state.currentLocation !== null && state.currentLocation.geolocationEnabled,

    isLocationFresh: (state) => {
      if (!state.lastUpdated) return false;
      const now = new Date();
      const elapsed = now.getTime() - state.lastUpdated.getTime();
      return elapsed < UPDATE_INTERVAL;
    },

    locationSummary: (state) => {
      if (!state.currentLocation?.geolocationEnabled) return 'Location disabled';
      if (state.currentLocation.location) return state.currentLocation.location;
      if (state.currentLocation.latitude && state.currentLocation.longitude) {
        return `${state.currentLocation.latitude.toFixed(4)}, ${state.currentLocation.longitude.toFixed(4)}`;
      }
      return 'Location unknown';
    },
  },

  actions: {
    async initializeTracking() {
      console.log('[LocationStore] Initializing location tracking...');

      // Check permission status
      this.permissionStatus = await GeolocationService.checkPermission();

      // If permission denied or unsupported, don't track
      if (this.permissionStatus === 'denied' || this.permissionStatus === 'unsupported') {
        console.log('[LocationStore] Location tracking disabled (permission denied or unsupported)');
        this.currentLocation = {
          latitude: 0,
          longitude: 0,
          geolocationEnabled: false,
        };
        return;
      }

      // Start tracking
      this.isTracking = true;

      // Get initial location
      await this.updateLocation();

      // Set up periodic updates (every 10 minutes)
      this.updateIntervalId = window.setInterval(() => {
        this.updateLocation();
      }, UPDATE_INTERVAL);

      console.log('[LocationStore] Location tracking started (updates every 10 minutes)');
    },

    async updateLocation() {
      console.log('[LocationStore] Updating location...');

      try {
        // Get location data (with reverse geocoding)
        const locationData = await GeolocationService.getGeolocationData();

        if (locationData) {
          this.currentLocation = locationData;
          this.lastUpdated = new Date();
          console.log('[LocationStore] Location updated:', {
            location: locationData.location || 'Unknown',
            coords: `${locationData.latitude}, ${locationData.longitude}`,
            enabled: locationData.geolocationEnabled,
          });
        } else {
          // Failed to get location
          this.currentLocation = {
            latitude: 0,
            longitude: 0,
            geolocationEnabled: false,
          };
          console.log('[LocationStore] Failed to get location');
        }
      } catch (error) {
        console.error('[LocationStore] Error updating location:', error);
        this.currentLocation = {
          latitude: 0,
          longitude: 0,
          geolocationEnabled: false,
        };
      }
    },

    stopTracking() {
      if (this.updateIntervalId !== null) {
        clearInterval(this.updateIntervalId);
        this.updateIntervalId = null;
      }
      this.isTracking = false;
      console.log('[LocationStore] Location tracking stopped');
    },

    async getCurrentLocation(): Promise<GeolocationData> {
      // If location is fresh (less than 10 minutes old), return cached
      if (this.isLocationFresh && this.currentLocation) {
        return this.currentLocation;
      }

      // Otherwise, update and return fresh location
      await this.updateLocation();

      return this.currentLocation || {
        latitude: 0,
        longitude: 0,
        geolocationEnabled: false,
      };
    },
  },
});
