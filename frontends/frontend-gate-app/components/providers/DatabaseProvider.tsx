'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('DatabaseProvider: Starting database initialization...')
        await db.init()
        console.log('DatabaseProvider: Database initialized successfully')
        setIsInitialized(true)
      } catch (err) {
        console.error('DatabaseProvider: Failed to initialize database:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    initDatabase()
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Database Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="mt-4 text-sm text-red-600">
            Please try refreshing the page or clearing your browser data for this site.
          </p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}