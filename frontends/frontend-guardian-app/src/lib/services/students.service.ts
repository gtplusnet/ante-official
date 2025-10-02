import { getSupabaseService } from './supabase.service';

export interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName?: string | null
  profilePhotoId?: string | null
  gradeLevel?: string | null
  section?: string | null
  isActive: boolean
  relationship?: string | null
  isPrimary?: boolean
}

export interface StudentAttendance {
  id: string
  studentId: string
  action: 'check_in' | 'check_out'
  timestamp: string
  location?: string | null
  deviceId?: string | null
}

export class StudentsSupabaseService {
  private supabaseService = getSupabaseService()

  async getGuardianStudents(guardianId: string): Promise<Student[]> {
    const client = await this.supabaseService.getClient()
    if (!client) return []

    const { data, error } = await client
      .from('StudentGuardian')
      .select(`
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
      `)
      .eq('guardianId', guardianId)

    if (error) {
      console.error('[StudentsSupabaseService] Error fetching students:', error)
      return []
    }

    // Map the joined data to our Student format
    return data?.map(item => ({
      ...(item as any).student,
      relationship: (item as any).relationship,
      isPrimary: (item as any).isPrimary
    })).filter(student => student.id) || []
  }

  async getStudentAttendanceHistory(
    studentId: string, 
    limit: number = 30
  ): Promise<StudentAttendance[]> {
    const client = await this.supabaseService.getClient()
    if (!client) return []

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('personId', studentId)
      .eq('personType', 'student')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[StudentsSupabaseService] Error fetching attendance:', error)
      return []
    }

    // Map SchoolAttendance records to StudentAttendance format
    return data?.map(record => ({
      id: (record as any).id,
      studentId: (record as any).personId,
      action: (record as any).action,
      timestamp: (record as any).timestamp,
      location: (record as any).location,
      deviceId: (record as any).deviceId
    })) || []
  }

  async getStudentAttendanceToday(studentId: string): Promise<StudentAttendance[]> {
    const client = await this.supabaseService.getClient()
    if (!client) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('personId', studentId)
      .eq('personType', 'student')
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[StudentsSupabaseService] Error fetching today attendance:', error)
      return []
    }

    // Map SchoolAttendance records to StudentAttendance format
    return data?.map(record => ({
      id: (record as any).id,
      studentId: (record as any).personId,
      action: (record as any).action,
      timestamp: (record as any).timestamp,
      location: (record as any).location,
      deviceId: (record as any).deviceId
    })) || []
  }

  // Subscribe to student attendance updates via broadcast channel
  async subscribeToStudentAttendance(
    studentIds: string[], 
    callback: (payload: any) => void
  ) {
    if (studentIds.length === 0) {
      console.warn('[StudentsSupabaseService] No student IDs provided')
      return () => {}
    }

    const client = await this.supabaseService.getClient()
    if (!client) {
      console.error('[StudentsSupabaseService] No Supabase client available for realtime')
      return () => {}
    }

    // Use company ID from environment to join the correct broadcast channel
    const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '16'
    const channelName = `attendance-updates-${companyId}`
    
    console.log(`[StudentsSupabaseService] Setting up broadcast listener on channel: ${channelName} for ${studentIds.length} students`)
    
    const channel = client
      .channel(channelName)
      .on('broadcast', { event: 'attendance_update' }, (payload) => {
        console.log('[StudentsSupabaseService] Received broadcast:', payload)
        
        // Check if this attendance update is for one of our students
        const attendanceRecord = payload.payload?.attendanceRecord
        if (attendanceRecord && studentIds.includes(attendanceRecord.personId)) {
          console.log(`[StudentsSupabaseService] Attendance update for monitored student: ${attendanceRecord.personId}`)
          
          // Transform broadcast payload to match expected callback format
          const transformedPayload = {
            eventType: payload.payload.eventType,
            new: attendanceRecord,
            personData: payload.payload.personData,
            timestamp: payload.payload.timestamp,
            source: payload.payload.source
          }
          
          callback(transformedPayload)
        } else if (attendanceRecord) {
          console.log(`[StudentsSupabaseService] Attendance update for different student: ${attendanceRecord.personId}`)
        }
      })
      .subscribe((status) => {
        console.log('[StudentsSupabaseService] Broadcast subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[StudentsSupabaseService] Successfully subscribed to attendance broadcasts')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[StudentsSupabaseService] Broadcast channel error')
        } else if (status === 'TIMED_OUT') {
          console.error('[StudentsSupabaseService] Broadcast subscription timed out')
        }
      })
    
    // Return cleanup function to unsubscribe
    return () => {
      console.log('[StudentsSupabaseService] Unsubscribing from attendance broadcasts')
      channel.unsubscribe()
    }
  }

  async getStudentProfile(studentId: string): Promise<Student | null> {
    const client = await this.supabaseService.getClient()
    if (!client) return null

    const { data, error } = await client
      .from('Student')
      .select('*')
      .eq('id', studentId)
      .single()

    if (error) {
      console.error('[StudentsSupabaseService] Error fetching student profile:', error)
      return null
    }

    return data
  }
}

// Singleton instance
let studentsServiceInstance: StudentsSupabaseService | null = null

export function getStudentsSupabaseService(): StudentsSupabaseService {
  if (!studentsServiceInstance) {
    studentsServiceInstance = new StudentsSupabaseService()
  }
  return studentsServiceInstance
}