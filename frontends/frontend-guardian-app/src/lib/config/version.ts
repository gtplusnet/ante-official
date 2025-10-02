// App version configuration
// This should be updated with each deployment
export const APP_VERSION = '1.0.1';
export const BUILD_TIME = new Date().toISOString();

// Cache version for service worker
// Increment this to force cache invalidation
export const CACHE_VERSION = 'v1';

// Version check interval (5 minutes)
export const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;

// Get version info
export const getVersionInfo = () => ({
  version: APP_VERSION,
  buildTime: BUILD_TIME,
  cacheVersion: CACHE_VERSION,
});

// Check if version has changed
export const hasVersionChanged = (oldVersion: string): boolean => {
  return oldVersion !== APP_VERSION;
};