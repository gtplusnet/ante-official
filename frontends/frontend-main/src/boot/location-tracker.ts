import { boot } from 'quasar/wrappers';
import { useLocationStore } from 'src/stores/location';
import { useAuthStore } from 'src/stores/auth';

export default boot(async ({ store }) => {
  const authStore = useAuthStore(store);
  const locationStore = useLocationStore(store);

  // Only initialize location tracking if user is authenticated
  // This prevents unnecessary location requests for anonymous users
  if (authStore.isAuthenticated) {
    // Initialize in background (non-blocking)
    locationStore.initializeTracking().catch((error) => {
      console.error('[Boot] Failed to initialize location tracking:', error);
    });
  }
});
