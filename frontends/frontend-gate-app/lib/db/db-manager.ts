/**
 * Centralized Database Manager
 * Ensures database is always initialized before any operations
 */

import { db } from './index';

class DatabaseManager {
  private static instance: DatabaseManager;
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database if not already initialized
   */
  private async ensureInitialized(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized && db.isInitialized()) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      try {
        await this.initPromise;
        return;
      } catch (error) {
        // Reset on error and try again
        this.initPromise = null;
        this.initialized = false;
      }
    }

    // Start new initialization
    console.log('DatabaseManager: Starting database initialization...');
    this.initPromise = this.initialize();
    
    try {
      await this.initPromise;
      this.initialized = true;
      console.log('DatabaseManager: Database initialized successfully');
    } catch (error) {
      console.error('DatabaseManager: Database initialization failed:', error);
      this.initPromise = null;
      this.initialized = false;
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  private async initialize(): Promise<void> {
    try {
      await db.init();
    } catch (error) {
      console.error('DatabaseManager: Error during db.init():', error);
      throw error;
    }
  }

  /**
   * Get a single record from a store
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    await this.ensureInitialized();
    return db.get<T>(storeName, key);
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string, query?: IDBKeyRange | IDBValidKey, count?: number): Promise<T[]> {
    await this.ensureInitialized();
    return db.getAll<T>(storeName, query, count);
  }

  /**
   * Get all records from a store by index
   */
  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    query?: IDBKeyRange | IDBValidKey,
    count?: number
  ): Promise<T[]> {
    await this.ensureInitialized();
    return db.getAllByIndex<T>(storeName, indexName, query, count);
  }

  /**
   * Put a record into a store
   */
  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    await this.ensureInitialized();
    return db.put<T>(storeName, value);
  }

  /**
   * Put multiple records into a store
   */
  async putAll<T>(storeName: string, values: T[]): Promise<void> {
    await this.ensureInitialized();
    return db.putAll<T>(storeName, values);
  }

  /**
   * Delete a record from a store
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.ensureInitialized();
    return db.delete(storeName, key);
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    await this.ensureInitialized();
    return db.clear(storeName);
  }

  /**
   * Count records in a store
   */
  async count(storeName: string, query?: IDBKeyRange | IDBValidKey): Promise<number> {
    await this.ensureInitialized();
    return db.count(storeName, query);
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    await this.ensureInitialized();
    return db.transaction<T>(storeNames, mode, operation);
  }

  /**
   * Clear all stores
   */
  async clearAllStores(): Promise<void> {
    await this.ensureInitialized();
    return db.clearAllStores();
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized && db.isInitialized();
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();