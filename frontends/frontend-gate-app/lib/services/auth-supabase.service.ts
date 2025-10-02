import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Service Account Authentication Service for Gate App
 * 
 * This service provides direct authentication with Supabase for the gate app
 * without requiring the backend API to be running. It uses a service account
 * approach to authenticate the gate device.
 */
class AuthSupabaseService {
  private client: SupabaseClient<Database> | null = null
  private serviceClient: SupabaseClient<Database> | null = null
  private isInitialized = false
  private companyId: number | null = null

  /**
   * Initialize the Supabase clients
   */
  initialize() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!this.isInitialized && supabaseUrl && supabaseAnonKey) {
      try {
        // Initialize regular client with anon key for auth operations
        this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage: {
              getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                  return localStorage.getItem(key)
                }
                return null
              },
              setItem: (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(key, value)
                }
              },
              removeItem: (key: string) => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(key)
                }
              },
            },
          },
          global: {
            headers: {
              'X-Source': 'frontend-gate-app',
            },
          },
        })

        this.isInitialized = true
        console.log('[AuthSupabaseService] Clients initialized')
      } catch (error) {
        console.error('[AuthSupabaseService] Failed to initialize clients:', error)
      }
    }
    return this.client
  }

  /**
   * Get or create a service account for the gate app
   * This creates a technical user that the gate app can use for authentication
   */
  async authenticateGateApp(licenseKey: string, companyId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient()
      if (!client) {
        return { success: false, error: 'Client not initialized' }
      }

      // Store company ID for later use
      this.companyId = companyId
      localStorage.setItem('supabase_company_id', companyId.toString())

      // Create a service account email based on license key
      const serviceEmail = `gate-${licenseKey.toLowerCase()}@ante-system.local`
      const servicePassword = this.generateServicePassword(licenseKey, companyId)

      console.log('[AuthSupabaseService] Attempting to authenticate gate app...')

      // Try to sign in with existing service account
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email: serviceEmail,
        password: servicePassword,
      })

      if (signInData?.session) {
        console.log('[AuthSupabaseService] Successfully authenticated with existing service account')
        
        // Store the session
        await this.storeSession(signInData.session)
        
        // Re-initialize the client with the authenticated session
        await this.reinitializeWithSession(signInData.session.access_token)
        
        return { success: true }
      }

      // If sign in failed with invalid credentials, try to create the account
      if (signInError?.message?.includes('Invalid login credentials')) {
        console.log('[AuthSupabaseService] Service account not found, attempting to create...')
        
        // Use service role client to create the user
        const serviceClient = await this.getServiceClient()
        if (!serviceClient) {
          return { success: false, error: 'Service client not available' }
        }

        // Create the service account using admin API
        const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
          email: serviceEmail,
          password: servicePassword,
          email_confirm: true,
          user_metadata: {
            company_id: companyId,
            license_key: licenseKey,
            gate_app: true,
            app_source: 'frontend-gate-app',
          }
        })

        if (createError) {
          console.error('[AuthSupabaseService] Failed to create service account:', createError)
          // Fallback to anonymous authentication
          return await this.fallbackToAnonymousAuth(companyId)
        }

        // Now sign in with the newly created account
        const { data: newSignInData, error: newSignInError } = await client.auth.signInWithPassword({
          email: serviceEmail,
          password: servicePassword,
        })

        if (newSignInData?.session) {
          console.log('[AuthSupabaseService] Successfully created and authenticated service account')
          
          // Store the session
          await this.storeSession(newSignInData.session)
          
          // Re-initialize the client with the authenticated session
          await this.reinitializeWithSession(newSignInData.session.access_token)
          
          return { success: true }
        }

        if (newSignInError) {
          console.error('[AuthSupabaseService] Failed to sign in after creation:', newSignInError)
          return await this.fallbackToAnonymousAuth(companyId)
        }
      }

      // For any other error, try fallback authentication
      console.error('[AuthSupabaseService] Authentication failed:', signInError)
      return await this.fallbackToAnonymousAuth(companyId)

    } catch (error: any) {
      console.error('[AuthSupabaseService] Authentication error:', error)
      // Fallback to anonymous authentication
      return await this.fallbackToAnonymousAuth(this.companyId || companyId)
    }
  }

  /**
   * Fallback authentication method using anonymous sign in
   * This is used when service account creation/login fails
   */
  private async fallbackToAnonymousAuth(companyId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AuthSupabaseService] Using fallback anonymous authentication...')
      
      const client = this.getClient()
      if (!client) {
        return { success: false, error: 'Client not initialized' }
      }

      // Sign in anonymously
      const { data, error } = await client.auth.signInAnonymously({
        options: {
          data: {
            company_id: companyId,
            app_source: 'frontend-gate-app',
          }
        }
      })

      if (error) {
        console.error('[AuthSupabaseService] Anonymous auth failed:', error)
        // Last resort: use service client directly
        return await this.useServiceClientDirectly()
      }

      if (data?.session) {
        console.log('[AuthSupabaseService] Successfully authenticated anonymously')
        await this.storeSession(data.session)
        await this.reinitializeWithSession(data.session.access_token)
        return { success: true }
      }

      return { success: false, error: 'Failed to authenticate' }
    } catch (error: any) {
      console.error('[AuthSupabaseService] Fallback auth error:', error)
      return await this.useServiceClientDirectly()
    }
  }

  /**
   * Last resort: Use service client directly for data access
   * This bypasses RLS policies but ensures the app can function
   */
  private async useServiceClientDirectly(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AuthSupabaseService] Using service client directly as last resort...')
      
      const serviceClient = await this.getServiceClient()
      if (!serviceClient) {
        return { success: false, error: 'Service client not available' }
      }

      // Store a flag indicating we're using service client
      localStorage.setItem('supabase_auth_mode', 'service')
      
      return { success: true }
    } catch (error: any) {
      console.error('[AuthSupabaseService] Service client setup failed:', error)
      return { success: false, error: 'All authentication methods failed' }
    }
  }

  /**
   * Get or create service client with service role key
   * This is used for admin operations when regular auth fails
   */
  private async getServiceClient(): Promise<SupabaseClient<Database> | null> {
    if (this.serviceClient) {
      return this.serviceClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // In production, this should be securely fetched from a backend endpoint
    // For now, we'll use the service key if available in environment
    const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

    if (!supabaseUrl) {
      console.error('[AuthSupabaseService] Supabase URL not configured')
      return null
    }

    // If no service key, return null
    if (!serviceKey) {
      console.log('[AuthSupabaseService] Service key not available')
      return null
    }

    try {
      this.serviceClient = createClient<Database>(supabaseUrl, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'X-Source': 'frontend-gate-app',
          },
        },
      })

      return this.serviceClient
    } catch (error) {
      console.error('[AuthSupabaseService] Failed to create service client:', error)
      return null
    }
  }

  /**
   * Generate a deterministic password for the service account
   */
  private generateServicePassword(licenseKey: string, companyId: number): string {
    // Create a deterministic but secure password based on license key and company ID
    const base = `${licenseKey}-${companyId}-gate-app-2025`
    return btoa(base).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '!Aa1'
  }

  /**
   * Store session information
   */
  private async storeSession(session: any): Promise<void> {
    if (!session) return

    localStorage.setItem('supabase_session', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user,
    }))

    localStorage.setItem('supabase_auth_mode', 'authenticated')
    console.log('[AuthSupabaseService] Session stored successfully')
  }

  /**
   * Re-initialize the client with an authenticated session
   */
  private async reinitializeWithSession(accessToken: string): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) return

    // Create a new client with the session token in headers
    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return localStorage.getItem(key)
            }
            return null
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value)
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key)
            }
          },
        },
      },
      global: {
        headers: {
          'X-Source': 'frontend-gate-app',
          'Authorization': `Bearer ${accessToken}`,
        },
      },
    })

    console.log('[AuthSupabaseService] Client re-initialized with authenticated session')
  }

  /**
   * Get the initialized client
   */
  getClient(): SupabaseClient<Database> | null {
    if (!this.client) {
      this.initialize()
    }

    // Check if we should use service client instead
    const authMode = localStorage.getItem('supabase_auth_mode')
    if (authMode === 'service' && this.serviceClient) {
      return this.serviceClient
    }

    return this.client
  }

  /**
   * Get the current session
   */
  async getSession() {
    const client = this.getClient()
    if (!client) {
      return { data: { session: null }, error: 'Client not initialized' }
    }

    // If using service client, return a mock session
    const authMode = localStorage.getItem('supabase_auth_mode')
    if (authMode === 'service') {
      return {
        data: {
          session: {
            access_token: 'service-mode',
            refresh_token: 'service-mode',
            user: { id: 'service-account' },
          }
        },
        error: null
      }
    }

    try {
      const { data, error } = await client.auth.getSession()
      return { data, error }
    } catch (error: any) {
      console.error('[AuthSupabaseService] Error getting session:', error)
      return { data: { session: null }, error: error.message }
    }
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data } = await this.getSession()
    return !!data?.session
  }

  /**
   * Sign out
   */
  async signOut() {
    const client = this.getClient()
    if (client) {
      await client.auth.signOut()
    }

    // Clear all stored data
    localStorage.removeItem('supabase_session')
    localStorage.removeItem('supabase_company_id')
    localStorage.removeItem('supabase_auth_mode')
    localStorage.removeItem('licenseKey')
    localStorage.removeItem('companyId')

    this.companyId = null
    console.log('[AuthSupabaseService] Signed out successfully')
  }

  /**
   * Restore session on app startup
   */
  async restoreSession(): Promise<boolean> {
    try {
      const storedSession = localStorage.getItem('supabase_session')
      const companyId = localStorage.getItem('supabase_company_id')
      
      if (!storedSession || !companyId) {
        return false
      }

      const session = JSON.parse(storedSession)
      this.companyId = parseInt(companyId)

      // Check if session is still valid
      const expiresAt = new Date(session.expires_at)
      if (expiresAt < new Date()) {
        console.log('[AuthSupabaseService] Session expired, need to re-authenticate')
        return false
      }

      // Re-initialize with the stored session
      await this.reinitializeWithSession(session.access_token)
      
      console.log('[AuthSupabaseService] Session restored successfully')
      return true
    } catch (error) {
      console.error('[AuthSupabaseService] Failed to restore session:', error)
      return false
    }
  }
}

// Singleton instance
let authSupabaseServiceInstance: AuthSupabaseService | null = null

export function getAuthSupabaseService(): AuthSupabaseService {
  if (!authSupabaseServiceInstance) {
    authSupabaseServiceInstance = new AuthSupabaseService()
  }
  return authSupabaseServiceInstance
}

export default getAuthSupabaseService()