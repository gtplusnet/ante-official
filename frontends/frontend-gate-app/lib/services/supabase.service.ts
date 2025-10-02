import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getAuthSupabaseService } from './auth-supabase.service'

class SupabaseService {
  private client: SupabaseClient<Database> | null = null
  private isInitialized = false
  private authService = getAuthSupabaseService()

  /**
   * Initialize the Supabase client
   */
  initialize() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!this.isInitialized && supabaseUrl && supabaseAnonKey) {
      try {
        this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage: {
              getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                  const item = localStorage.getItem(key)
                  return item ? JSON.parse(item) : null
                }
                return null
              },
              setItem: (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(key, JSON.stringify(value))
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
              'X-Source': 'frontend-gate-app', // Gate app specific source for RLS policies
            },
          },
        })
        this.isInitialized = true
        console.log('[SupabaseService] Client initialized')
      } catch (error) {
        console.error('[SupabaseService] Failed to initialize client:', error)
      }
    }
    return this.client
  }

  /**
   * Get the Supabase client instance
   * Uses the authenticated client from auth service if available
   */
  getClient() {
    // First try to get the authenticated client from auth service
    const authClient = this.authService.getClient()
    if (authClient) {
      return authClient
    }
    
    // Fallback to regular client initialization
    if (!this.client) {
      this.initialize()
    }
    return this.client
  }

  /**
   * Set the session with tokens received from backend
   */
  async setSession(accessToken: string, refreshToken: string) {
    if (!accessToken || !refreshToken) {
      console.warn('[SupabaseService] No tokens provided')
      return { data: null, error: 'No tokens provided' }
    }

    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await client.auth.setSession({
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

  /**
   * Get the current session
   */
  async getSession() {
    const client = this.getClient()
    if (!client) {
      return { data: { session: null }, error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await client.auth.getSession()
      return { data, error }
    } catch (error: any) {
      console.error('[SupabaseService] Error getting session:', error)
      return { data: { session: null }, error: error.message }
    }
  }

  /**
   * Sign out and clear the session
   */
  async signOut() {
    const client = this.getClient()
    if (!client) {
      return { error: 'Supabase client not initialized' }
    }

    try {
      const { error } = await client.auth.signOut()
      if (error) {
        console.error('[SupabaseService] Failed to sign out:', error)
        return { error: error.message }
      }

      console.log('[SupabaseService] Signed out successfully')
      return { error: null }
    } catch (error: any) {
      console.error('[SupabaseService] Error signing out:', error)
      return { error: error.message }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = this.getClient()
    if (!client) {
      console.error('[SupabaseService] Client not initialized')
      return () => {} // Return empty unsubscribe function
    }

    const { data } = client.auth.onAuthStateChange(callback)
    return data?.subscription?.unsubscribe || (() => {})
  }

  /**
   * Get attendance records with realtime subscription
   */
  subscribeToAttendance(callback: (payload: any) => void) {
    const client = this.getClient()
    if (!client) {
      console.error('[SupabaseService] Client not initialized')
      return () => {}
    }

    const channel = client
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SchoolAttendance',
        },
        callback
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  /**
   * Get students data
   */
  async getStudents(companyId: number) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('Student')
      .select(`
        id,
        studentNumber,
        firstName,
        lastName,
        middleName,
        profilePhotoId,
        isActive,
        companyId
      `)
      .eq('companyId', companyId)
      .eq('isActive', true)
      .order('lastName', { ascending: true })

    return { data, error }
  }

  /**
   * Get guardians data
   */
  async getGuardians(companyId: number) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('Guardian')
      .select(`
        id,
        firstName,
        lastName,
        middleName,
        contactNumber,
        email,
        isActive,
        companyId,
        students:StudentGuardian(
          student:Student(
            id,
            firstName,
            lastName,
            studentNumber
          )
        )
      `)
      .eq('companyId', companyId)
      .eq('isActive', true)
      .order('lastName', { ascending: true })

    return { data, error }
  }

  /**
   * Get today's attendance records
   */
  async getTodayAttendance(companyId: number, limit = 100) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('companyId', companyId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(guardianId: string, callback: (payload: any) => void) {
    const client = this.getClient()
    if (!client) {
      console.error('[SupabaseService] Client not initialized')
      return () => {}
    }

    const channel = client
      .channel(`guardian-notifications-${guardianId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'GuardianNotification',
          filter: `guardianId=eq.${guardianId}`,
        },
        callback
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}

// Singleton instance
let supabaseServiceInstance: SupabaseService | null = null

export function getSupabaseService(): SupabaseService {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = new SupabaseService()
  }
  return supabaseServiceInstance
}

export default getSupabaseService()