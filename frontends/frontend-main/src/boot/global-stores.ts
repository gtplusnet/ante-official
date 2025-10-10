import { boot } from 'quasar/wrappers';
import { createApp, h } from 'vue';
import { Quasar, QSpinnerOrbit } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { useProjectStore } from '../stores/project';
import { useAssigneeStore } from '../stores/assignee';
import LoadingSplash from '../components/shared/LoadingSplash.vue';

/**
 * Initialize global stores (Project and Assignee)
 *
 * This function can be called from multiple places:
 * 1. Boot file (on app start if already logged in)
 * 2. Login success handler (after user logs in)
 * 3. Account switch handler (when user switches accounts)
 *
 * Shows Quasar Loading indicator during initialization for better UX.
 *
 * @param store - Pinia store instance (optional, will use default if not provided)
 * @returns Promise<boolean> - true if successful, false if skipped or failed
 */
export async function initializeGlobalStores(store?: any): Promise<boolean> {
  const authStore = useAuthStore(store);

  // Skip if user is not authenticated
  if (!authStore.isAuthenticated) {
    console.log('[GlobalStores] User not authenticated, skipping initialization');
    return false;
  }

  // Variables to track splash app for cleanup
  let splashApp: any = null;
  let splashContainer: HTMLElement | null = null;

  try {
    // Show custom loading splash screen
    splashContainer = document.createElement('div');
    splashContainer.id = 'loading-splash-container';
    document.body.appendChild(splashContainer);

    splashApp = createApp({
      render: () => h(LoadingSplash, {
        message: 'Loading application data...',
        submessage: 'Please wait...'
      })
    });

    // Register Quasar and required components
    splashApp.use(Quasar, {
      components: { QSpinnerOrbit }
    });

    splashApp.mount(splashContainer);

    console.log('[GlobalStores] Initializing stores for user:', authStore.accountInformation?.username);

    // Get store instances
    const projectStore = useProjectStore(store);
    const assigneeStore = useAssigneeStore(store);

    // Load both stores in parallel for faster initialization
    const results = await Promise.allSettled([
      projectStore.fetchProjects(),
      assigneeStore.fetchAssignees()
    ]);

    // Check results
    const projectSuccess = results[0].status === 'fulfilled';
    const assigneeSuccess = results[1].status === 'fulfilled';

    if (!projectSuccess) {
      console.error('[GlobalStores] Failed to load projects:', results[0]);
    }
    if (!assigneeSuccess) {
      console.error('[GlobalStores] Failed to load assignees:', results[1]);
    }

    console.log('[GlobalStores] Initialization complete:', {
      projects: projectSuccess,
      assignees: assigneeSuccess
    });

    // Return true if at least one store loaded successfully
    return projectSuccess || assigneeSuccess;
  } catch (error) {
    console.error('[GlobalStores] Unexpected error during initialization:', error);
    return false;
  } finally {
    // Always hide and cleanup loading splash
    try {
      if (splashApp) {
        splashApp.unmount();
      }
      if (splashContainer) {
        splashContainer.remove();
      }
      // Also clean up any orphaned containers
      const orphanedContainer = document.getElementById('loading-splash-container');
      if (orphanedContainer) {
        orphanedContainer.remove();
      }
    } catch (cleanupError) {
      console.error('[GlobalStores] Error during splash cleanup:', cleanupError);
      // Force remove any splash elements
      const allSplashContainers = document.querySelectorAll('#loading-splash-container, .loading-splash-overlay');
      allSplashContainers.forEach(el => el.remove());
    }
  }
}

/**
 * Boot file export - runs automatically on app startup
 * Only initializes if user is already authenticated (e.g., returning user with valid token)
 */
export default boot(async ({ store }) => {
  console.log('[Boot] Running global-stores boot file');
  await initializeGlobalStores(store);
});
