import { getSupabaseService } from './supabase.service';

export interface StudentData {
  id: string
  qrCode: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName?: string | null
  profilePhotoId?: number | null
  isActive: boolean
  companyId: number
}

export interface GuardianData {
  id: string
  qrCode: string
  firstName: string
  lastName: string
  middleName?: string | null
  contactNumber?: string | null
  email?: string | null
  isActive: boolean
  companyId: number
  students?: Array<{
    student: StudentData
    relationship?: string | null
    isPrimary: boolean
  }>
}

export interface SyncStatus {
  lastSyncTime: Date | null
  totalStudents: number
  totalGuardians: number
  isConnected: boolean
  deviceName?: string
}

export class SyncSupabaseService {
  private supabaseService = getSupabaseService()
  
  async init(): Promise<void> {
    const client = this.supabaseService.getClient()
    if (!client) {
      throw new Error('Supabase client not initialized')
    }
    console.log('[SyncSupabaseService] Initialized')
  }

  async syncStudents(): Promise<StudentData[]> {
    console.log('[SyncSupabaseService] Starting student sync...')
    const client = this.supabaseService.getClient()
    if (!client) {
      console.error('[SyncSupabaseService] No Supabase client available')
      return []
    }

    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    console.log('[SyncSupabaseService] Using companyId:', companyId)

    const { data, error } = await client
      .from('Student')
      .select('*')
      .eq('companyId', companyId)
      .eq('isActive', true)
      .order('lastName', { ascending: true })

    if (error) {
      console.error('[SyncSupabaseService] Error syncing students:', error)
      console.error('[SyncSupabaseService] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log(`[SyncSupabaseService] Raw data from Supabase:`, data)
    console.log(`[SyncSupabaseService] Synced ${data?.length || 0} students`)
    
    // Generate QR codes for each student
    const studentsWithQR: StudentData[] = (data || []).map((student: any) => ({
      ...student,
      qrCode: `student:${student.id}`
    }))

    console.log('[SyncSupabaseService] Students with QR codes:', studentsWithQR.length > 0 ? studentsWithQR[0] : 'none')
    
    // Store in localStorage for offline access (optional)
    if (studentsWithQR.length > 0) {
      localStorage.setItem('cached_students', JSON.stringify(studentsWithQR))
      localStorage.setItem('last_student_sync', new Date().toISOString())
      console.log('[SyncSupabaseService] Cached students to localStorage')
    }

    return studentsWithQR
  }

  async syncGuardians(): Promise<GuardianData[]> {
    console.log('[SyncSupabaseService] Starting guardian sync...')
    const client = this.supabaseService.getClient()
    if (!client) {
      console.error('[SyncSupabaseService] No Supabase client available for guardians')
      return []
    }

    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    console.log('[SyncSupabaseService] Using companyId for guardians:', companyId)

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
            profilePhotoId
          )
        )
      `)
      .eq('companyId', companyId)
      .eq('isActive', true)
      .order('lastName', { ascending: true })

    if (error) {
      console.error('[SyncSupabaseService] Error syncing guardians:', error)
      console.error('[SyncSupabaseService] Guardian error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log(`[SyncSupabaseService] Raw guardian data from Supabase:`, data)

    console.log(`[SyncSupabaseService] Synced ${data?.length || 0} guardians`)
    
    // Generate QR codes for each guardian and nested students
    const guardiansWithQR: GuardianData[] = (data || []).map((guardian: any) => ({
      ...guardian,
      qrCode: `guardian:${guardian.id}`,
      students: guardian.students?.map((studentRel: any) => ({
        ...studentRel,
        student: {
          ...studentRel.student,
          qrCode: `student:${studentRel.student.id}`
        }
      }))
    }))
    
    // Store in localStorage for offline access (optional)
    if (guardiansWithQR.length > 0) {
      localStorage.setItem('cached_guardians', JSON.stringify(guardiansWithQR))
      localStorage.setItem('last_guardian_sync', new Date().toISOString())
    }

    return guardiansWithQR
  }

  async syncAll(): Promise<{
    students: StudentData[]
    guardians: GuardianData[]
  }> {
    const [students, guardians] = await Promise.all([
      this.syncStudents(),
      this.syncGuardians()
    ])

    return { students, guardians }
  }

  async getStudentByQRCode(qrCode: string): Promise<StudentData | null> {
    const client = this.supabaseService.getClient()
    if (!client) return null

    // QR code format: "student:studentId"
    const [type, studentId] = qrCode.split(':')
    if (type !== 'student') return null

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

    const { data, error } = await client
      .from('Student')
      .select('*')
      .eq('id', studentId)
      .eq('companyId', companyId)
      .single()

    if (error) {
      console.error('[SyncSupabaseService] Error fetching student:', error)
      return null
    }

    return data
  }

  async getGuardianByQRCode(qrCode: string): Promise<GuardianData | null> {
    const client = this.supabaseService.getClient()
    if (!client) return null

    // QR code format: "guardian:guardianId"
    const [type, guardianId] = qrCode.split(':')
    if (type !== 'guardian') return null

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

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
            profilePhotoId
          )
        )
      `)
      .eq('id', guardianId)
      .eq('companyId', companyId)
      .single()

    if (error) {
      console.error('[SyncSupabaseService] Error fetching guardian:', error)
      return null
    }

    return data
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const client = this.supabaseService.getClient()
    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    
    let totalStudents = 0
    let totalGuardians = 0

    if (client && companyId) {
      // Get counts from Supabase
      const { count: studentCount } = await client
        .from('Student')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', companyId)
        .eq('isActive', true)

      const { count: guardianCount } = await client
        .from('Guardian')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', companyId)
        .eq('isActive', true)

      totalStudents = studentCount || 0
      totalGuardians = guardianCount || 0
    }

    const lastStudentSync = localStorage.getItem('last_student_sync')
    const lastGuardianSync = localStorage.getItem('last_guardian_sync')
    const lastSyncTime = lastStudentSync || lastGuardianSync 
      ? new Date(Math.max(
          lastStudentSync ? new Date(lastStudentSync).getTime() : 0,
          lastGuardianSync ? new Date(lastGuardianSync).getTime() : 0
        ))
      : null

    return {
      lastSyncTime,
      totalStudents,
      totalGuardians,
      isConnected: !!client,
      deviceName: localStorage.getItem('deviceName') || undefined
    }
  }

  // Subscribe to student updates
  subscribeToStudents(callback: (payload: any) => void) {
    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    
    return this.supabaseService.getClient()
      ?.channel(`students-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Student',
          filter: `companyId=eq.${companyId}`
        },
        (payload) => {
          console.log('[SyncSupabaseService] Student update:', payload)
          callback(payload)
        }
      )
      .subscribe()
  }

  // Subscribe to guardian updates
  subscribeToGuardians(callback: (payload: any) => void) {
    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    
    return this.supabaseService.getClient()
      ?.channel(`guardians-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Guardian',
          filter: `companyId=eq.${companyId}`
        },
        (payload) => {
          console.log('[SyncSupabaseService] Guardian update:', payload)
          callback(payload)
        }
      )
      .subscribe()
  }

  // Get person data by QR code (student or guardian)
  async getPersonByQRCode(qrCode: string): Promise<{
    type: 'student' | 'guardian',
    data: StudentData | GuardianData
  } | null> {
    const [type] = qrCode.split(':')
    
    if (type === 'student') {
      const student = await this.getStudentByQRCode(qrCode)
      if (student) {
        return { type: 'student', data: student }
      }
    } else if (type === 'guardian') {
      const guardian = await this.getGuardianByQRCode(qrCode)
      if (guardian) {
        return { type: 'guardian', data: guardian }
      }
    }
    
    return null
  }
}

// Singleton instance
let syncServiceInstance: SyncSupabaseService | null = null

export function getSyncSupabaseService(): SyncSupabaseService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncSupabaseService()
  }
  return syncServiceInstance
}