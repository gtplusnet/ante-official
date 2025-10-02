import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { fallbackAuthService } from './fallback-auth.service'

class SupabaseService {
  private client: SupabaseClient<Database> | null = null
  private fallbackClient: SupabaseClient | null = null
  private static instance: SupabaseService | null = null
  private usingFallback: boolean = false

  private constructor() {}

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService()
    }
    return SupabaseService.instance
  }

  initialize() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[SupabaseService] Missing Supabase configuration')
      return
    }

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key)
            }
            return null
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value)
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key)
            }
          },
        },
      },
      global: {
        headers: {
          'X-Source': 'frontend-guardian-app',
        },
      },
    })

    console.log('[SupabaseService] Initialized')
  }

  async getClient(): Promise<SupabaseClient<Database> | null> {
    // First try regular client
    if (!this.client) {
      this.initialize()
    }
    
    // Check if we have a valid session
    if (this.client) {
      const { data: { session } } = await this.client.auth.getSession()
      if (session) {
        console.log('[SupabaseService] Using regular guardian client for realtime')
        this.usingFallback = false
        return this.client
      }
    }
    
    // If no session, try fallback authentication
    console.log('[SupabaseService] No guardian session, using fallback authentication')
    try {
      this.fallbackClient = await fallbackAuthService.getAuthenticatedClient() as SupabaseClient<Database>
      this.usingFallback = true
      console.log('[SupabaseService] Using fallback client for realtime - ready for subscriptions')
      return this.fallbackClient
    } catch (error) {
      console.error('[SupabaseService] Fallback authentication failed:', error)
      console.warn('[SupabaseService] Returning regular client as last resort - realtime may not work')
      return this.client // Return regular client as last resort
    }
  }
  
  getClientSync(): SupabaseClient<Database> | null {
    if (!this.client) {
      this.initialize()
    }
    return this.usingFallback ? this.fallbackClient : this.client
  }

  async setSession(accessToken: string, refreshToken: string): Promise<{ data: any; error: string | null }> {
    if (!accessToken || !refreshToken) {
      console.warn('[SupabaseService] No tokens provided')
      return { data: null, error: 'No tokens provided' }
    }

    if (!this.client) {
      this.initialize()
    }
    
    if (!this.client) {
      return { data: null, error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await this.client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      
      if (error) {
        console.error('[SupabaseService] Failed to set session:', error)
        return { data: null, error: error.message }
      }
      
      console.log('[SupabaseService] Session set successfully')
      return { data, error: null }
    } catch (error: any) {
      console.error('[SupabaseService] Error setting session:', error)
      return { data: null, error: error.message }
    }
  }

  async getSession() {
    if (!this.client) {
      return null
    }
    
    const { data: { session }, error } = await this.client.auth.getSession()
    
    if (error) {
      console.error('[SupabaseService] Error getting session:', error)
      return null
    }
    
    return session
  }

  async clearSession() {
    if (!this.client) {
      return
    }
    
    const { error } = await this.client.auth.signOut()
    
    if (error) {
      console.error('[SupabaseService] Error clearing session:', error)
    } else {
      console.log('[SupabaseService] Session cleared')
    }
  }

  /**
   * Get guardian profile
   */
  async getGuardianProfile(guardianId: string) {
    const client = await this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('Guardian')
      .select(`
        *,
        students:StudentGuardian(
          relationship,
          isPrimary,
          student:Student(
            id,
            studentNumber,
            firstName,
            lastName,
            middleName,
            profilePhotoId,
            isActive
          )
        )
      `)
      .eq('id', guardianId)
      .single()

    return { data, error }
  }
}

// Export singleton instance
export function getSupabaseService(): SupabaseService {
  return SupabaseService.getInstance()
}