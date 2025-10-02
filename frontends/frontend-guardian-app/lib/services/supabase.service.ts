import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

class SupabaseService {
  private client: SupabaseClient<Database> | null = null
  private isInitialized = false

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
              'X-Source': 'frontend-guardian-app', // Identify source for RLS policies
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
   */
  getClient() {
    if (!this.client) {
      this.initialize()
    }
    return this.client
  }

  /**
   * Set the session with tokens received from backend
   */
  async setSession(accessToken: string, refreshToken: string): Promise<{ data: any; error: string | null }> {
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
   * Get guardian profile
   */
  async getGuardianProfile(guardianId: string) {
    const client = this.getClient()
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
            profilePhotoUrl,
            gradeLevel,
            section,
            isActive
          )
        )
      `)
      .eq('id', guardianId)
      .single()

    return { data, error }
  }

  /**
   * Get student attendance history
   */
  async getStudentAttendance(studentId: string, limit = 50) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('personId', studentId)
      .eq('personType', 'student')
      .order('timestamp', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Get guardian notifications
   */
  async getGuardianNotifications(guardianId: string, limit = 50) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('GuardianNotification')
      .select('*')
      .eq('guardianId', guardianId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = (await (client as any)
      .from('GuardianNotification')
      .update({ readAt: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single())

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SchoolNotification',
          filter: `guardianId=eq.${guardianId}`,
        },
        callback
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  /**
   * Subscribe to student attendance updates
   */
  subscribeToStudentAttendance(studentIds: string[], callback: (payload: any) => void) {
    const client = this.getClient()
    if (!client) {
      console.error('[SupabaseService] Client not initialized')
      return () => {}
    }

    const channels = studentIds.map(studentId => {
      return client
        .channel(`student-attendance-${studentId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'SchoolAttendance',
            filter: `personId=eq.${studentId}`,
          },
          (payload) => {
            callback({ ...payload, studentId })
          }
        )
        .subscribe()
    })

    return () => {
      channels.forEach(channel => channel.unsubscribe())
    }
  }

  /**
   * Get school notifications for guardian
   */
  async getSchoolNotifications(guardianId: string, limit = 50) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = await client
      .from('SchoolNotification')
      .select(`
        *,
        student:Student(
          id,
          firstName,
          lastName,
          studentNumber,
          profilePhotoUrl
        )
      `)
      .eq('guardianId', guardianId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Mark school notification as read
   */
  async markSchoolNotificationRead(notificationId: string) {
    const client = this.getClient()
    if (!client) {
      return { data: null, error: 'Client not initialized' }
    }

    const { data, error } = (await (client as any)
      .from('SchoolNotification')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single())

    return { data, error }
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