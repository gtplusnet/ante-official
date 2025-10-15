/**
 * Sync API Service for Gate App
 * Replaces Supabase with REST API calls to backend
 */

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = `${API_URL}/api/public/school-gate`;

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

export interface APIResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

export class SyncAPIService {
  private licenseKey: string | null = null

  async init(): Promise<void> {
    this.licenseKey = localStorage.getItem('licenseKey')
    if (!this.licenseKey) {
      throw new Error('License key not found - please login first')
    }
    console.log('[SyncAPIService] Initialized')
  }

  /**
   * Get request headers with license key
   */
  private getHeaders(): HeadersInit {
    if (!this.licenseKey) {
      this.licenseKey = localStorage.getItem('licenseKey')
    }
    return {
      'Content-Type': 'application/json',
      'x-license-key': this.licenseKey || '',
    }
  }

  /**
   * Sync students from backend
   */
  async syncStudents(): Promise<StudentData[]> {
    console.log('[SyncAPIService] Starting student sync...')

    try {
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          limit: 10000, // Get all active students
          offset: 0
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync students')
      }

      const result: APIResponse<any> = await response.json()
      console.log(`[SyncAPIService] Synced ${result.data.length} students`)

      // Transform API response to match StudentData interface
      const studentsWithQR: StudentData[] = result.data.map((student: any) => ({
        id: student.studentId, // API returns studentId, map to id
        qrCode: `student:${student.studentId}`,
        studentNumber: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: null,
        profilePhotoId: null,
        isActive: true,
        companyId: parseInt(localStorage.getItem('companyId') || '0')
      }))

      // Cache to localStorage for offline access
      if (studentsWithQR.length > 0) {
        localStorage.setItem('cached_students', JSON.stringify(studentsWithQR))
        localStorage.setItem('last_student_sync', new Date().toISOString())
        console.log('[SyncAPIService] Cached students to localStorage')
      }

      return studentsWithQR
    } catch (error: any) {
      console.error('[SyncAPIService] Error syncing students:', error)

      // Try to return cached data on error
      const cached = localStorage.getItem('cached_students')
      if (cached) {
        console.log('[SyncAPIService] Using cached students due to sync error')
        return JSON.parse(cached)
      }

      return []
    }
  }

  /**
   * Sync guardians from backend
   */
  async syncGuardians(): Promise<GuardianData[]> {
    console.log('[SyncAPIService] Starting guardian sync...')

    try {
      const response = await fetch(`${API_BASE}/guardians`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          limit: 10000, // Get all active guardians
          offset: 0
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync guardians')
      }

      const result: APIResponse<any> = await response.json()
      console.log(`[SyncAPIService] Synced ${result.data.length} guardians`)

      // Transform API response to match GuardianData interface
      const guardiansWithQR: GuardianData[] = result.data.map((guardian: any) => ({
        id: guardian.id,
        qrCode: `guardian:${guardian.id}`,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: null,
        contactNumber: guardian.contactNumber || null,
        email: guardian.email || null,
        isActive: true,
        companyId: parseInt(localStorage.getItem('companyId') || '0'),
        students: [] // Guardians endpoint doesn't include students for now
      }))

      // Cache to localStorage for offline access
      if (guardiansWithQR.length > 0) {
        localStorage.setItem('cached_guardians', JSON.stringify(guardiansWithQR))
        localStorage.setItem('last_guardian_sync', new Date().toISOString())
        console.log('[SyncAPIService] Cached guardians to localStorage')
      }

      return guardiansWithQR
    } catch (error: any) {
      console.error('[SyncAPIService] Error syncing guardians:', error)

      // Try to return cached data on error
      const cached = localStorage.getItem('cached_guardians')
      if (cached) {
        console.log('[SyncAPIService] Using cached guardians due to sync error')
        return JSON.parse(cached)
      }

      return []
    }
  }

  /**
   * Sync both students and guardians
   */
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

  /**
   * Get student by QR code from local cache
   */
  async getStudentByQRCode(qrCode: string): Promise<StudentData | null> {
    // QR code format: "student:studentId"
    const [type, studentId] = qrCode.split(':')
    if (type !== 'student') return null

    // Try to get from cache first
    const cached = localStorage.getItem('cached_students')
    if (cached) {
      const students: StudentData[] = JSON.parse(cached)
      const student = students.find(s => s.id === studentId || s.studentNumber === studentId)
      if (student) return student
    }

    // If not in cache, try to sync and retry
    const students = await this.syncStudents()
    return students.find(s => s.id === studentId || s.studentNumber === studentId) || null
  }

  /**
   * Get guardian by QR code from local cache
   */
  async getGuardianByQRCode(qrCode: string): Promise<GuardianData | null> {
    // QR code format: "guardian:guardianId"
    const [type, guardianId] = qrCode.split(':')
    if (type !== 'guardian') return null

    // Try to get from cache first
    const cached = localStorage.getItem('cached_guardians')
    if (cached) {
      const guardians: GuardianData[] = JSON.parse(cached)
      const guardian = guardians.find(g => g.id === guardianId)
      if (guardian) return guardian
    }

    // If not in cache, try to sync and retry
    const guardians = await this.syncGuardians()
    return guardians.find(g => g.id === guardianId) || null
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    // Get cached counts
    const cachedStudents = localStorage.getItem('cached_students')
    const cachedGuardians = localStorage.getItem('cached_guardians')

    const totalStudents = cachedStudents ? JSON.parse(cachedStudents).length : 0
    const totalGuardians = cachedGuardians ? JSON.parse(cachedGuardians).length : 0

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
      isConnected: !!this.licenseKey, // Consider connected if we have license key
      deviceName: localStorage.getItem('deviceName') || undefined
    }
  }

  /**
   * Subscribe to student updates (deprecated - use WebSocket)
   */
  subscribeToStudents(callback: (payload: any) => void) {
    console.warn('[SyncAPIService] subscribeToStudents is deprecated')
    console.warn('[SyncAPIService] Use websocketService.subscribeToSync() instead')

    // Return dummy cleanup function for compatibility
    return () => {
      console.log('[SyncAPIService] Dummy unsubscribe called')
    }
  }

  /**
   * Subscribe to guardian updates (deprecated - use WebSocket)
   */
  subscribeToGuardians(callback: (payload: any) => void) {
    console.warn('[SyncAPIService] subscribeToGuardians is deprecated')
    console.warn('[SyncAPIService] Use websocketService.subscribeToSync() instead')

    // Return dummy cleanup function for compatibility
    return () => {
      console.log('[SyncAPIService] Dummy unsubscribe called')
    }
  }

  /**
   * Get person data by QR code (student or guardian)
   */
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
let syncServiceInstance: SyncAPIService | null = null

export function getSyncAPIService(): SyncAPIService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncAPIService()
  }
  return syncServiceInstance
}
