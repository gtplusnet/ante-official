import { boot } from 'quasar/wrappers';
import { LoadingBar } from 'quasar';
import { whitelabel } from '../boot/axios';

// Configure LoadingBar defaults
LoadingBar.setDefaults({
  color: 'primary',
  size: '3px',
  position: 'top'
});

// Global state for title animation coordination
window.__titleAnimationActive = false;
window.__pendingTitle = null;
window.__routeBasedTitle = false; // Flag to indicate if title was set by route
window.__routeLoadingActive = false; // Flag to indicate if route is loading


export default boot(({ router }) => {
  // Track if we're currently loading a route
  let routeLoadingTimeout;
  let titleAnimationInterval;
  let originalTitle = '';
  let animationStartTime = 0;
  let targetRouteTitle = ''; // Store the title of the route we're navigating to
  
  // Helper function to generate title from route
  const getTitleFromRoute = (route) => {
    let routeTitle = '';
    if (route.meta && route.meta.title) {
      routeTitle = route.meta.title;
    } else if (route.name) {
      // Generate title from route name (e.g., 'member_dashboard' -> 'Dashboard')
      const parts = route.name.split('_');
      if (parts.length > 1) {
        // Take the last part and capitalize it
        routeTitle = parts[parts.length - 1]
          .split(/(?=[A-Z])/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        routeTitle = route.name.charAt(0).toUpperCase() + route.name.slice(1);
      }
    }
    
    const appName = whitelabel === 'geer' ? 'GEER' : 'Ante';
    return routeTitle ? `${routeTitle} | ${appName}` : appName;
  };
  
  // Set initial title based on current route
  const currentRoute = router.currentRoute.value;
  if (currentRoute) {
    document.title = getTitleFromRoute(currentRoute);
  }
  
  // Minimum animation duration to ensure visibility
  const MIN_ANIMATION_DURATION = 1000; // Increased to 1 second
  
  // Title animation frames - rotating spinner
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let currentFrame = 0;
  
  // Use spinner frames
  const frames = spinnerFrames;
  
  // Start title animation
  const startTitleAnimation = (baseTitle) => {
    
    // Mark animation as active globally
    window.__titleAnimationActive = true;
    animationStartTime = Date.now();
    
    // Use provided base title or fall back to current document title
    originalTitle = baseTitle || document.title;
    currentFrame = 0;
    
    // Clear any existing animation
    if (titleAnimationInterval) {
      clearInterval(titleAnimationInterval);
    }
    
    // Set initial title immediately (first frame)
    const initialTitle = `${frames[0]} ${originalTitle}`;
    document.title = initialTitle;
    
    // Start the animation with faster interval
    titleAnimationInterval = setInterval(() => {
      currentFrame = (currentFrame + 1) % frames.length;
      const newTitle = `${frames[currentFrame]} ${originalTitle}`;
      
      document.title = newTitle;
    }, 200); // Faster animation (was 300ms)
    
  };
  
  // Stop title animation
  const stopTitleAnimation = () => {
    // Check if minimum duration has passed
    const elapsed = Date.now() - animationStartTime;
    if (elapsed < MIN_ANIMATION_DURATION && window.__titleAnimationActive) {
      // Delay stop to ensure minimum visibility
      const delay = MIN_ANIMATION_DURATION - elapsed;
      setTimeout(() => stopTitleAnimation(), delay);
      return;
    }
    
    
    // Mark animation as inactive
    window.__titleAnimationActive = false;
    
    if (titleAnimationInterval) {
      clearInterval(titleAnimationInterval);
      titleAnimationInterval = null;
    }
    
    // Check if there's a pending title update
    if (window.__pendingTitle) {
      document.title = window.__pendingTitle;
      window.__pendingTitle = null;
    } else if (targetRouteTitle) {
      // Set the target route title
      document.title = targetRouteTitle;
    } else if (originalTitle) {
      // Restore original title as fallback
      document.title = originalTitle;
    }
    
    originalTitle = '';
  };

  // Start loading bar before each route navigation
  router.beforeEach((to, from, next) => {
    // Mark route as loading
    window.__routeLoadingActive = true;
    
    // Clear any existing timeout
    if (routeLoadingTimeout) {
      clearTimeout(routeLoadingTimeout);
    }

    // Start the loading bar
    LoadingBar.start();
    
    // Store the target route title
    targetRouteTitle = getTitleFromRoute(to);
    
    // Start title animation with target route title
    startTitleAnimation(targetRouteTitle);

    // Set a timeout to increment the loading bar if the route takes too long
    routeLoadingTimeout = setTimeout(() => {
      LoadingBar.increment(0.3);
    }, 300);

    next();
  });

  // Stop loading bar after route navigation is complete
  router.afterEach((to) => {
    // Clear the timeout
    if (routeLoadingTimeout) {
      clearTimeout(routeLoadingTimeout);
      routeLoadingTimeout = null;
    }

    // Stop the loading bar
    LoadingBar.stop();
    
    // Update targetRouteTitle based on the completed navigation
    targetRouteTitle = getTitleFromRoute(to);
    
    // Stop title animation
    stopTitleAnimation();
    
    // Mark route loading as complete after a small delay to allow components to mount
    setTimeout(() => {
      window.__routeLoadingActive = false;
    }, 100);
  });

  // Handle route errors (e.g., failed lazy loads)
  router.onError((error) => {
    
    // Mark route loading as complete
    window.__routeLoadingActive = false;
    
    // Stop the loading bar
    LoadingBar.stop();
    
    // Stop title animation
    stopTitleAnimation();
    
    // Clear timeout
    if (routeLoadingTimeout) {
      clearTimeout(routeLoadingTimeout);
      routeLoadingTimeout = null;
    }

    // Check if it's a chunk loading error
    if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
      // Show user-friendly error message
      import('quasar').then(({ Notify }) => {
        Notify.create({
          type: 'negative',
          message: 'Failed to load page. Please refresh and try again.',
          position: 'top',
          timeout: 5000,
          actions: [
            {
              label: 'Refresh',
              color: 'white',
              handler: () => {
                window.location.reload();
              }
            }
          ]
        });
      });
    }
  });
});