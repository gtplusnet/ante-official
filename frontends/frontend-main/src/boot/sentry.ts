import { boot } from 'quasar/wrappers';
import * as Sentry from '@sentry/vue';
// Remove unused imports since we're using Sentry.ErrorEvent and Sentry.EventHint directly

export default boot(({ app, router }) => {
  // Initialize Sentry in development, staging and production environments
  const environment = process.env.ENVIRONMENT || 'development';
  const isMonitoringEnvironment = ['development', 'staging', 'production'].includes(environment) && process.env.VITE_SENTRY_DSN;

  if (isMonitoringEnvironment) {
    console.log(`[SENTRY] Initializing Sentry for environment: ${environment}`);
    
    Sentry.init({
      app,
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.VITE_SENTRY_ENVIRONMENT || environment,
      
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      
      integrations: [
        // Browser tracing with Vue Router
        Sentry.browserTracingIntegration({ 
          router,
          // Don't trace certain routes to reduce noise
          routeLabel: 'path',
        }),
        
        // Session replay for better debugging
        Sentry.replayIntegration({
          maskAllText: true, // Protect user data
          blockAllMedia: true, // Don't capture media
        }),
        
        
        // Note: consoleIntegration is available in newer Sentry versions
      ],
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in staging
      
      // Session replay settings
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // User context and PII
      sendDefaultPii: false, // Don't send PII by default
      
      // Trace propagation for backend communication  
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/backend-ante\.geertest\.com\/api/, // Staging
        /^https:\/\/backend\.ante\.ph\/api/, // Production
        /^wss:\/\/socket-ante\.geertest\.com/, // Staging WebSocket
        /^wss:\/\/socket\.ante\.ph/, // Production WebSocket
      ],
      
      // Enhanced error filtering and context
      beforeSend: (event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null => {
        // Filter out known non-critical errors
        const error = hint.originalException as Error;
        if (error) {
          // Skip common Vue warnings and expected errors
          if (error.message?.includes('ResizeObserver loop limit exceeded') ||
              error.message?.includes('Non-Error promise rejection captured') ||
              error.message?.includes('Script error') ||
              error.message?.includes('ChunkLoadError')) {
            return null;
          }
        }
        
        // Add frontend-specific context
        event.tags = {
          ...event.tags,
          environment,
          whitelabel: process.env.WHITELABEL || 'ante',
          frontend_version: process.env.npm_package_version || '1.0.0',
        };
        
        // Add user context if available (from Vue store)
        try {
          const userStore = app.config.globalProperties.$store?.user;
          if (userStore && userStore.currentUser) {
            event.user = {
              id: userStore.currentUser.id,
              username: userStore.currentUser.username,
              email: userStore.currentUser.email,
            };
          }
        } catch (e) {
          // Ignore errors when getting user context
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'NetworkError',
        // Browser extension errors
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Vue-specific non-critical warnings
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Ad blocker related
        'atomicFindClose',
        // Third-party script errors
        'Script error.',
      ],
      
      // Additional configuration options can be added here
    });
    
    // Set user context globally
    const setUser = (user: { id: string | number; username?: string; email?: string }) => {
      Sentry.setUser({
        id: user.id.toString(),
        username: user.username,
        email: user.email,
      });
    };
    
    // Make setUser available globally
    app.config.globalProperties.$sentrySetUser = setUser;
    
    console.log(`[SENTRY] Sentry initialized successfully for ${environment} environment`);
  } else {
    console.log(`[SENTRY] Sentry disabled for development environment`);
    
    // Provide noop functions in development
    app.config.globalProperties.$sentrySetUser = () => {};
  }
});

// Export flag for checking if Sentry is enabled
export const isSentryEnabled = ['development', 'staging', 'production'].includes(process.env.ENVIRONMENT || 'development') && !!process.env.VITE_SENTRY_DSN;