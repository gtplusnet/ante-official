/**
 * Centralized IndexedDB Manager
 * Handles all database operations for the School Gatekeep application
 */

export interface DBConfig {
  name: string;
  version: number;
  stores: {
    [storeName: string]: {
      keyPath: string;
      indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
      }>;
    };
  };
}

class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  // Force database version to be 6 to trigger upgrade and remove old stores
  private readonly DB_VERSION = 6;
  private readonly DB_NAME = 'SchoolGatekeepDB';
  
  private readonly config: DBConfig = {
    name: 'SchoolGatekeepDB',
    version: 6,
    stores: {
      students: {
        keyPath: 'id',
        indexes: [
          { name: 'qrCode', keyPath: 'qrCode', options: { unique: true } },
          { name: 'studentNumber', keyPath: 'studentNumber' },
          { name: 'syncedAt', keyPath: 'syncedAt' }
        ]
      },
      guardians: {
        keyPath: 'id',
        indexes: [
          { name: 'qrCode', keyPath: 'qrCode', options: { unique: true } },
          { name: 'email', keyPath: 'email' },
          { name: 'syncedAt', keyPath: 'syncedAt' }
        ]
      },
      metadata: {
        keyPath: 'key'
      }
    }
  };

  private constructor() {}

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  async init(): Promise<void> {
    // If already initialized, return
    if (this.db) {
      console.log('IndexedDB: Already initialized');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.isInitializing && this.initPromise) {
      console.log('IndexedDB: Initialization in progress, waiting...');
      return this.initPromise;
    }

    console.log('IndexedDB: Starting initialization...');
    this.isInitializing = true;
    this.initPromise = this.openDatabase();

    try {
      await this.initPromise;
      console.log('IndexedDB: Initialization completed successfully');
    } catch (error) {
      console.error('IndexedDB: Initialization failed:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use the constants to ensure version is always 4
      console.log(`IndexedDB: Opening ${this.DB_NAME} with version ${this.DB_VERSION}`);
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log(`IndexedDB: Database opened successfully. Version: ${this.db.version}, Stores: ${Array.from(this.db.objectStoreNames).join(', ')}`);
        
        // Handle database close events
        this.db.onclose = () => {
          console.log('IndexedDB: Database connection closed');
          this.db = null;
        };

        // Check if we have all required stores
        const requiredStores = ['students', 'guardians', 'metadata'];
        const missingStores = requiredStores.filter(store => !this.db!.objectStoreNames.contains(store));
        
        if (missingStores.length > 0) {
          console.error('IndexedDB: Missing required stores:', missingStores);
          // Close the database and force re-initialization
          this.db.close();
          this.db = null;
          reject(new Error(`Database is missing required stores: ${missingStores.join(', ')}`));
          return;
        }

        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log(`IndexedDB: Upgrade needed from version ${event.oldVersion} to ${event.newVersion}`);
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        
        // Delete old stores that are no longer needed (attendance and syncQueue)
        const storesToDelete = ['attendance', 'syncQueue'];
        for (const storeName of storesToDelete) {
          if (db.objectStoreNames.contains(storeName)) {
            console.log(`IndexedDB: Deleting obsolete store ${storeName}`);
            db.deleteObjectStore(storeName);
          }
        }
        
        // Create or update stores
        for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
          let objectStore: IDBObjectStore;
          
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`IndexedDB: Creating store ${storeName}`);
            objectStore = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
          } else {
            // Store exists, get it from the transaction
            console.log(`IndexedDB: Store ${storeName} already exists`);
            objectStore = transaction.objectStore(storeName);
          }

          // Create indexes
          if (storeConfig.indexes) {
            for (const index of storeConfig.indexes) {
              if (!objectStore.indexNames.contains(index.name)) {
                try {
                  console.log(`IndexedDB: Creating index ${index.name} on ${storeName}`);
                  objectStore.createIndex(index.name, index.keyPath, index.options);
                } catch (e) {
                  console.warn(`Failed to create index ${index.name} on ${storeName}:`, e);
                }
              }
            }
          }
        }
        
        console.log('IndexedDB: Upgrade completed');
      };
    });
  }

  private ensureDb(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    this.ensureDb();
    
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    const transaction = this.db!.transaction(stores, mode);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        // Transaction completed successfully
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };

      transaction.onabort = () => {
        reject(new Error('Transaction aborted'));
      };

      operation(transaction)
        .then(resolve)
        .catch(reject);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.transaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAll<T>(storeName: string, query?: IDBKeyRange | IDBValidKey, count?: number): Promise<T[]> {
    return this.transaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll(query, count);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    query?: IDBKeyRange | IDBValidKey,
    count?: number
  ): Promise<T[]> {
    return this.transaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(query, count);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    return this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async putAll<T>(storeName: string, values: T[]): Promise<void> {
    return this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      
      const promises = values.map(value => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(value);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clear(storeName: string): Promise<void> {
    return this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async count(storeName: string, query?: IDBKeyRange | IDBValidKey): Promise<number> {
    return this.transaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.count(query);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clearAllStores(): Promise<void> {
    const storeNames = Object.keys(this.config.stores);
    
    return this.transaction(storeNames, 'readwrite', async (tx) => {
      const promises = storeNames.map(storeName => {
        const store = tx.objectStore(storeName);
        
        return new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  isInitialized(): boolean {
    return this.db !== null;
  }
}

// Export singleton instance
export const db = IndexedDBManager.getInstance();

// Export types
export type { IndexedDBManager };