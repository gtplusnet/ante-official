import { NotificationRealtimeService } from '../notifications/NotificationRealtimeService';
import { SupabaseRealtimeService } from '../base/SupabaseRealtimeService';

/**
 * Factory for creating realtime services
 * Implements Factory pattern for extensible service creation
 */
class RealtimeServiceFactory {
  constructor() {
    // Registry of available service classes
    this.serviceRegistry = new Map();
    
    // Register default services
    this.registerDefaultServices();
  }

  /**
   * Register default realtime services
   * @private
   */
  registerDefaultServices() {
    this.register('AccountNotifications', NotificationRealtimeService);
    this.register('Notifications', NotificationRealtimeService);
  }

  /**
   * Register a new realtime service class
   * @param {String} tableName - The table name this service handles
   * @param {Class} ServiceClass - The service class (must extend SupabaseRealtimeService)
   */
  register(tableName, ServiceClass) {
    if (!tableName || !ServiceClass) {
      throw new Error('Table name and service class are required');
    }

    this.serviceRegistry.set(tableName, ServiceClass);
    console.log(`Registered realtime service for table: ${tableName}`);
  }

  /**
   * Create a realtime service instance for a specific table
   * @param {String} tableName - The table name
   * @param {Object} options - Additional options for service creation
   * @returns {SupabaseRealtimeService} The service instance
   */
  create(tableName, options = {}) {
    const ServiceClass = this.serviceRegistry.get(tableName);
    
    if (!ServiceClass) {
      throw new Error(`No realtime service registered for table: ${tableName}`);
    }

    const service = new ServiceClass(options);
    
    console.log(`Created realtime service for table: ${tableName}`);
    return service;
  }

  /**
   * Check if a service is registered for a table
   * @param {String} tableName - The table name
   * @returns {Boolean} True if service is registered
   */
  hasService(tableName) {
    return this.serviceRegistry.has(tableName);
  }

  /**
   * Get all registered table names
   * @returns {Array<String>} Array of table names
   */
  getRegisteredTables() {
    return Array.from(this.serviceRegistry.keys());
  }

  /**
   * Unregister a service
   * @param {String} tableName - The table name
   * @returns {Boolean} True if unregistered successfully
   */
  unregister(tableName) {
    return this.serviceRegistry.delete(tableName);
  }

  /**
   * Clear all registered services
   */
  clear() {
    this.serviceRegistry.clear();
    // Re-register default services
    this.registerDefaultServices();
  }

  /**
   * Create a generic realtime service with custom configuration
   * Useful for tables without specific service implementations
   * @param {Object} config - Realtime configuration
   * @returns {SupabaseRealtimeService} Generic service instance
   */
  createGeneric(config) {
    if (!config || !config.table) {
      throw new Error('Table configuration is required for generic service');
    }

    // Create anonymous class with the provided configuration
    class GenericRealtimeService extends SupabaseRealtimeService {
      getConfig() {
        return config;
      }
    }

    return new GenericRealtimeService();
  }

  /**
   * Batch create multiple services
   * @param {Array<String>} tableNames - Array of table names
   * @returns {Map<String, SupabaseRealtimeService>} Map of table names to services
   */
  createBatch(tableNames) {
    const services = new Map();
    
    for (const tableName of tableNames) {
      try {
        const service = this.create(tableName);
        services.set(tableName, service);
      } catch (error) {
        console.error(`Failed to create service for ${tableName}:`, error);
      }
    }
    
    return services;
  }
}

// Create and export singleton instance
const factory = new RealtimeServiceFactory();

// Example of how to register additional services:
// import { TaskRealtimeService } from '../tasks/TaskRealtimeService';
// factory.register('Task', TaskRealtimeService);

export default factory;