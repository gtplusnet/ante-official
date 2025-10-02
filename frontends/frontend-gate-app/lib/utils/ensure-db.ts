import { db } from '@/lib/db'

let initPromise: Promise<void> | null = null
let initialized = false

export async function ensureDatabase(): Promise<void> {
  if (initialized) {
    return
  }
  
  if (initPromise) {
    return initPromise
  }
  
  initPromise = (async () => {
    try {
      console.log('ensureDatabase: Initializing IndexedDB...')
      await db.init()
      initialized = true
      console.log('ensureDatabase: Database initialized successfully')
    } catch (error) {
      console.error('ensureDatabase: Failed to initialize database:', error)
      // Reset so it can be retried
      initPromise = null
      throw error
    }
  })()
  
  return initPromise
}