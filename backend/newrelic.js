'use strict'
/**
 * New Relic agent configuration for ANTE Backend
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || 'ante-backend'],
  
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '4f44bbc368fc2f052b332f162e215aecFFFFNRAL',
  
  /**
   * Logging configuration
   */
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    filepath: 'stdout'
  },
  
  /**
   * Enable distributed tracing
   */
  distributed_tracing: {
    enabled: true
  },
  
  /**
   * Application logging
   */
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: false
    }
  },
  
  /**
   * Error collection
   */
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
    capture_events: true,
    max_event_samples_stored: 100
  },
  
  /**
   * Transaction tracer
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
    explain_threshold: 500,
    stack_trace_threshold: 500
  },
  
  /**
   * Slow SQL
   */
  slow_sql: {
    enabled: true,
    max_samples: 10
  },
  
  /**
   * Custom parameters
   */
  capture_params: true,
  ignored_params: ['password', 'token', 'api_key', 'secret', 'TELEGRAM_BOT_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'],
  
  /**
   * Security settings
   */
  high_security: false,
  
  /**
   * Custom instrumentation for NestJS
   */
  rules: {
    ignore: [
      '^/health$',
      '^/metrics$'
    ]
  },
  
  /**
   * Browser monitoring (for API responses)
   */
  browser_monitoring: {
    enable: false
  },
  
  /**
   * Labels for environment identification
   */
  labels: {
    environment: process.env.NODE_ENV || 'development',
    service: 'backend-api',
    version: process.env.APP_VERSION || '1.0.0',
    server: process.env.SERVER_NAME || 'local'
  }
}