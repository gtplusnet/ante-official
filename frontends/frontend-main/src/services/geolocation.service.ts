import { Dialog } from 'quasar';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  location?: string; // Location name from reverse geocoding
  geolocationEnabled: boolean;
}

export class GeolocationService {
  // Cache for reverse geocoded locations (1 hour TTL)
  private static locationCache = new Map<string, { location: string; timestamp: number }>();
  private static CACHE_TTL = 3600000; // 1 hour

  /**
   * Check if geolocation is supported
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check geolocation permission status
   */
  static async checkPermission(): Promise<PermissionState | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state;
    } catch (error) {
      return 'prompt';
    }
  }

  /**
   * Get current position with timeout
   */
  static async getCurrentPosition(timeout = 10000): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }

  /**
   * Reverse geocode using Nominatim (OpenStreetMap) - FREE
   */
  private static async reverseGeocodeNominatim(lat: number, lon: number): Promise<string | undefined> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        {
          headers: {
            'User-Agent': 'ANTE-ERP-TimeTracker/1.0',
          },
        }
      );

      if (!response.ok) return undefined;

      const data = await response.json();
      const address = data.address;

      // Extract city and country
      const city = address.city || address.town || address.village || address.municipality;
      const country = address.country;

      if (city && country) {
        return `${city}, ${country}`; // "Manila, Philippines"
      } else if (country) {
        return country; // "Philippines"
      }

      return undefined;
    } catch (error) {
      console.error('Nominatim reverse geocoding failed:', error);
      return undefined;
    }
  }

  /**
   * Reverse geocode using BigDataCloud - FREE (fallback)
   */
  private static async reverseGeocodeBigDataCloud(lat: number, lon: number): Promise<string | undefined> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );

      if (!response.ok) return undefined;

      const data = await response.json();
      const city = data.city || data.locality;
      const country = data.countryName;

      if (city && country) {
        return `${city}, ${country}`;
      } else if (country) {
        return country;
      }

      return undefined;
    } catch (error) {
      console.error('BigDataCloud reverse geocoding failed:', error);
      return undefined;
    }
  }

  /**
   * Reverse geocode coordinates to location name with caching and fallback
   */
  static async reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
    // Round to 3 decimals (~110m accuracy) for cache key
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

    // Check cache
    const cached = this.locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.location;
    }

    // Try Nominatim first (primary)
    let location = await this.reverseGeocodeNominatim(lat, lon);

    // Fallback to BigDataCloud if Nominatim fails
    if (!location) {
      location = await this.reverseGeocodeBigDataCloud(lat, lon);
    }

    // Cache result if successful
    if (location) {
      this.locationCache.set(cacheKey, { location, timestamp: Date.now() });
    }

    return location;
  }

  /**
   * Get geolocation data (coordinates + location name)
   */
  static async getGeolocationData(): Promise<GeolocationData | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      // Get coordinates
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Reverse geocode to get location name
      let location: string | undefined;
      try {
        location = await this.reverseGeocode(latitude, longitude);
      } catch (error) {
        console.warn('Could not get location name:', error);
      }

      return {
        latitude,
        longitude,
        location, // "Manila, Philippines" or undefined
        geolocationEnabled: true,
      };
    } catch (error: any) {
      console.error('Geolocation error:', error);

      return {
        latitude: 0,
        longitude: 0,
        geolocationEnabled: false,
      };
    }
  }

  /**
   * Show warning dialog when geolocation is disabled
   */
  static showPermissionWarning(): Promise<boolean> {
    return new Promise((resolve) => {
      Dialog.create({
        title: 'Geolocation Disabled',
        message:
          'Location tracking is disabled. Your location will not be recorded with this time entry. Do you want to continue?',
        cancel: {
          label: 'Cancel',
          flat: true,
          color: 'grey',
        },
        ok: {
          label: 'Continue Without Location',
          flat: false,
          color: 'primary',
        },
        persistent: true,
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
  }

  /**
   * Request geolocation with user-friendly flow
   * Shows warning if disabled
   */
  static async requestWithWarning(): Promise<GeolocationData | null> {
    const permission = await this.checkPermission();

    // If explicitly denied, show warning
    if (permission === 'denied' || permission === 'unsupported') {
      const shouldContinue = await this.showPermissionWarning();
      if (!shouldContinue) {
        return null; // User cancelled
      }

      return {
        latitude: 0,
        longitude: 0,
        geolocationEnabled: false,
      };
    }

    // Try to get geolocation
    const geoData = await this.getGeolocationData();

    // If failed, show warning
    if (!geoData || !geoData.geolocationEnabled) {
      const shouldContinue = await this.showPermissionWarning();
      if (!shouldContinue) {
        return null;
      }

      return {
        latitude: 0,
        longitude: 0,
        geolocationEnabled: false,
      };
    }

    return geoData;
  }

  /**
   * Get geolocation silently (no warnings)
   * Used for time-out when we don't want to block the user
   */
  static async getGeolocationSilent(): Promise<GeolocationData> {
    const geoData = await this.getGeolocationData();

    if (!geoData || !geoData.geolocationEnabled) {
      return {
        latitude: 0,
        longitude: 0,
        geolocationEnabled: false,
      };
    }

    return geoData;
  }
}
