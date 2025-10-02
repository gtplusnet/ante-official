'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getAuthSupabaseService } from '@/lib/services/auth-supabase.service'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  companyId: number | null
  licenseKey: string | null
  restoreSession: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  companyId: null,
  licenseKey: null,
  restoreSession: async () => false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [licenseKey, setLicenseKey] = useState<string | null>(null)
  const router = useRouter()
  const authService = getAuthSupabaseService()

  const restoreSession = async (): Promise<boolean> => {
    try {
      console.log('[AuthProvider] Attempting to restore session...')
      
      // Check for stored license key
      const storedLicenseKey = localStorage.getItem('licenseKey')
      const storedCompanyId = localStorage.getItem('companyId')
      
      if (!storedLicenseKey || !storedCompanyId) {
        console.log('[AuthProvider] No stored credentials found')
        return false
      }

      // Try to restore Supabase session
      const sessionRestored = await authService.restoreSession()
      
      if (!sessionRestored) {
        // Session expired or invalid, try to re-authenticate
        console.log('[AuthProvider] Session expired, re-authenticating...')
        
        const authResult = await authService.authenticateGateApp(
          storedLicenseKey,
          parseInt(storedCompanyId)
        )
        
        if (!authResult.success) {
          console.error('[AuthProvider] Re-authentication failed:', authResult.error)
          return false
        }
      }

      // Verify session is working
      const isAuth = await authService.isAuthenticated()
      
      if (isAuth) {
        setLicenseKey(storedLicenseKey)
        setCompanyId(parseInt(storedCompanyId))
        setIsAuthenticated(true)
        console.log('[AuthProvider] Session restored successfully')
        return true
      }
      
      return false
    } catch (error) {
      console.error('[AuthProvider] Error restoring session:', error)
      return false
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      
      // Clear all auth state
      setIsAuthenticated(false)
      setCompanyId(null)
      setLicenseKey(null)
      
      // Clear cookies
      document.cookie = 'licenseKey=; path=/; max-age=0'
      
      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      
      try {
        const restored = await restoreSession()
        
        if (!restored) {
          // Check if we're on a protected route
          const pathname = window.location.pathname
          const publicRoutes = ['/login', '/']
          
          if (!publicRoutes.includes(pathname)) {
            console.log('[AuthProvider] No valid session, redirecting to login')
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const value = {
    isAuthenticated,
    isLoading,
    companyId,
    licenseKey,
    restoreSession,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}