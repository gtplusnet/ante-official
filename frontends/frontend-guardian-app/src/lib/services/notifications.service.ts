import { getSupabaseService } from './supabase.service';

export interface GuardianNotification {
  id: string
  guardianId: string
  type: string
  title: string
  body: string
  data?: any
  readAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface SchoolNotification {
  id: string
  type: string
  studentId?: string | null
  studentName?: string | null
  guardianId: string
  action?: string | null
  location?: string | null
  timestamp: string
  read: boolean
  photoUrl?: string | null
  companyId: number
  student?: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
    profilePhotoId?: string | null
  }
}

export class NotificationsSupabaseService {
  private supabaseService = getSupabaseService()

  async getGuardianNotifications(
    guardianId: string,
    limit: number = 50
  ): Promise<GuardianNotification[]> {
    const client = await this.supabaseService.getClient()
    if (!client) return []

    const { data, error } = await client
      .from('GuardianNotification')
      .select('*')
      .eq('guardianId', guardianId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[NotificationsSupabaseService] Error fetching guardian notifications:', error)
      return []
    }

    return data || []
  }

  async getSchoolNotifications(
    guardianId: string,
    limit: number = 50
  ): Promise<SchoolNotification[]> {
    const client = await this.supabaseService.getClient()
    if (!client) return []

    const { data, error } = await client
      .from('SchoolNotification')
      .select(`
        *,
        student:Student(
          id,
          firstName,
          lastName,
          studentNumber,
          profilePhotoId
        )
      `)
      .eq('guardianId', guardianId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[NotificationsSupabaseService] Error fetching school notifications:', error)
      return []
    }

    return data || []
  }

  async getUnreadCount(guardianId: string): Promise<number> {
    const client = await this.supabaseService.getClient()
    if (!client) return 0

    const [guardianCount, schoolCount] = await Promise.all([
      // Count unread guardian notifications
      client
        .from('GuardianNotification')
        .select('*', { count: 'exact', head: true })
        .eq('guardianId', guardianId)
        .is('readAt', null),
      
      // Count unread school notifications
      client
        .from('SchoolNotification')
        .select('*', { count: 'exact', head: true })
        .eq('guardianId', guardianId)
        .eq('read', false)
    ])

    const total = (guardianCount.count || 0) + (schoolCount.count || 0)
    return total
  }

  async markGuardianNotificationAsRead(notificationId: string): Promise<boolean> {
    const client = await this.supabaseService.getClient()
    if (!client) return false

    const { error } = (await (client as any)
      .from('GuardianNotification')
      .update({ readAt: new Date().toISOString() })
      .eq('id', notificationId))

    if (error) {
      console.error('[NotificationsSupabaseService] Error marking guardian notification as read:', error)
      return false
    }

    return true
  }

  async markSchoolNotificationAsRead(notificationId: string): Promise<boolean> {
    const client = await this.supabaseService.getClient()
    if (!client) return false

    const { error } = (await (client as any)
      .from('SchoolNotification')
      .update({ read: true })
      .eq('id', notificationId))

    if (error) {
      console.error('[NotificationsSupabaseService] Error marking school notification as read:', error)
      return false
    }

    return true
  }

  async markAllAsRead(guardianId: string): Promise<boolean> {
    const client = await this.supabaseService.getClient()
    if (!client) return false

    const [guardianResult, schoolResult] = await Promise.all([
      // Mark all guardian notifications as read
      (client as any)
        .from('GuardianNotification')
        .update({ readAt: new Date().toISOString() })
        .eq('guardianId', guardianId)
        .is('readAt', null),
      
      // Mark all school notifications as read
      (client as any)
        .from('SchoolNotification')
        .update({ read: true })
        .eq('guardianId', guardianId)
        .eq('read', false)
    ])

    if (guardianResult.error || schoolResult.error) {
      console.error('[NotificationsSupabaseService] Error marking all as read:', {
        guardian: guardianResult.error,
        school: schoolResult.error
      })
      return false
    }

    return true
  }

  // Subscribe to new notifications
  async subscribeToNotifications(
    guardianId: string,
    callback: (payload: any) => void
  ) {
    const client = await this.supabaseService.getClient()
    if (!client) return () => {}

    const channel = client
      .channel(`guardian-notifications-${guardianId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'GuardianNotification',
          filter: `guardianId=eq.${guardianId}`
        },
        (payload) => {
          console.log('[NotificationsSupabaseService] New guardian notification:', payload)
          callback({ type: 'guardian', ...payload })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SchoolNotification',
          filter: `guardianId=eq.${guardianId}`
        },
        (payload) => {
          console.log('[NotificationsSupabaseService] New school notification:', payload)
          callback({ type: 'school', ...payload })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  // Get all notifications (combined)
  async getAllNotifications(
    guardianId: string,
    limit: number = 50
  ): Promise<Array<GuardianNotification | SchoolNotification>> {
    const [guardianNotifs, schoolNotifs] = await Promise.all([
      this.getGuardianNotifications(guardianId, limit),
      this.getSchoolNotifications(guardianId, limit)
    ])

    // Combine and sort by timestamp
    const combined = [
      ...guardianNotifs.map(n => ({ ...n, notificationType: 'guardian' as const })),
      ...schoolNotifs.map(n => ({ ...n, notificationType: 'school' as const }))
    ]

    // Sort by timestamp/createdAt (newest first)
    combined.sort((a, b) => {
      const timeA = new Date('timestamp' in a ? a.timestamp : a.createdAt).getTime()
      const timeB = new Date('timestamp' in b ? b.timestamp : b.createdAt).getTime()
      return timeB - timeA
    })

    return combined.slice(0, limit)
  }
}

// Singleton instance
let notificationsServiceInstance: NotificationsSupabaseService | null = null

export function getNotificationsSupabaseService(): NotificationsSupabaseService {
  if (!notificationsServiceInstance) {
    notificationsServiceInstance = new NotificationsSupabaseService()
  }
  return notificationsServiceInstance
}