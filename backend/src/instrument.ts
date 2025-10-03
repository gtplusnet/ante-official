import * as Sentry from '@sentry/nestjs';
import { config } from 'dotenv';

// Load environment variables first (only if .env file exists - for local development)
const ENV = process.env.NODE_ENV;
const fs = require('fs');

// Try to load environment-specific file first, then fallback to .env
// In Docker/production, environment variables are already set, so this is optional
const envFile = ENV && fs.existsSync(`.env.${ENV}`) ? `.env.${ENV}` : '.env';
if (fs.existsSync(envFile)) {
  config({ path: envFile });
  console.log(`[SENTRY DEBUG] Loaded environment from: ${envFile}`);
} else {
  console.log(`[SENTRY DEBUG] No .env file found (using container environment variables)`);
}

// Initialize Sentry in development, staging and production environments
const environment = process.env.NODE_ENV || 'development';
const isMonitoringEnvironment =
  ['development', 'staging', 'production'].includes(environment) &&
  process.env.SENTRY_DSN;

console.log(
  `[SENTRY DEBUG] NODE_ENV: ${process.env.NODE_ENV}, environment: ${environment}`,
);
console.log(`[SENTRY DEBUG] SENTRY_DSN present: ${!!process.env.SENTRY_DSN}`);
console.log(
  `[SENTRY DEBUG] isMonitoringEnvironment: ${isMonitoringEnvironment}`,
);

if (isMonitoringEnvironment) {
  console.log(`[SENTRY] Initializing Sentry for environment: ${environment}`);

  // Ensure to call this before requiring any other modules!
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || environment,

    // Server name for easier identification in Sentry
    serverName: process.env.SERVER_NAME || `ante-backend-${environment}`,

    // Release tracking (optional)
    release: process.env.npm_package_version || '1.0.0',

    integrations: [
      // HTTP instrumentation for request/response tracking
      Sentry.httpIntegration({
        // Don't capture health checks and common static assets
        ignoreIncomingRequests: (url) => {
          return (
            url.includes('/health') ||
            url.includes('/metrics') ||
            url.includes('/favicon.ico') ||
            url.includes('/robots.txt')
          );
        },
      }),

      // Node.js specific integrations
      Sentry.nodeContextIntegration(),
      Sentry.consoleIntegration(),

      // Database integrations
      Sentry.postgresIntegration(),
      Sentry.mongoIntegration(),
      Sentry.redisIntegration(),

      // Prisma integration for database query tracking
      Sentry.prismaIntegration(),
    ],

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : environment === 'staging' ? 0.5 : 0, // 10% in prod, 50% in staging, 0% in dev

    // Enhanced error context
    beforeSend: (event, hint) => {
      // Filter out known non-critical errors
      const error = hint.originalException as Error;
      if (error) {
        // Skip 404s and validation errors
        if (
          error.message?.includes('404') ||
          error.message?.includes('ValidationError')
        ) {
          return null;
        }
      }

      // Add additional context
      event.tags = {
        ...event.tags,
        server_name: process.env.SERVER_NAME || `ante-backend-${environment}`,
        node_env: environment,
      };

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser-specific errors that don't apply to backend
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      // Common validation errors
      'ValidationError',
      'Bad Request',
    ],
  });

  console.log(
    `[SENTRY] Sentry initialized successfully for ${environment} environment`,
  );
} else {
  console.log(`[SENTRY] Sentry disabled for development environment`);
}

// Export a flag to check if Sentry is enabled
export const isSentryEnabled = isMonitoringEnvironment;
