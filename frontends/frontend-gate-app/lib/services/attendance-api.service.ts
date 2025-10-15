/**
 * Attendance API Service for Gate App
 * Replaces Supabase with REST API calls to backend
 */

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = `${API_URL}/api/public/school-gate`;

export interface AttendanceRecord {
  id: string
  qrCode: string
  personId: string
  personType: 'student' | 'guardian'
  personName: string
  firstName?: string | null
  lastName?: string | null
  profilePhotoUrl?: string | null
  action: 'check_in' | 'check_out'
  timestamp: Date | string
  deviceId?: string | null
  location?: string | null
  companyId: number
}

export interface AttendanceStats {
  todayTotal: number
  pendingSync: number
  lastScanTime: Date | null
  checkIns: number
  checkOuts: number
}

export interface APIResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

export class AttendanceAPIService {
  private licenseKey: string | null = null
  private recentScansCache = new Map<string, { action: string, timestamp: number }>() // Throttle duplicate scans

  async init(): Promise<void> {
    this.licenseKey = localStorage.getItem('licenseKey')
    if (!this.licenseKey) {
      throw new Error('License key not found - please login first')
    }
    console.log('[AttendanceAPIService] Initialized')
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
   * Record attendance via smart QR scan endpoint
   */
  async recordAttendance(qrCode: string, personData?: any): Promise<AttendanceRecord> {
    // Check local cache first to prevent race conditions
    const personId = qrCode.split(':')[1] || qrCode // Extract person ID from QR code
    const cacheKey = `${personId}-${new Date().toDateString()}`
    const cachedScan = this.recentScansCache.get(cacheKey)
    const currentTimeMs = Date.now()

    // If scanned within last 10 seconds, reject to prevent duplicates
    if (cachedScan && (currentTimeMs - cachedScan.timestamp) < 10000) {
      console.log(`[AttendanceAPIService] Scan throttled - person was scanned ${Math.round((currentTimeMs - cachedScan.timestamp) / 1000)}s ago`)
      throw new Error('Please wait 10 seconds before scanning the same person again')
    }

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          qrCode,
          timestamp: new Date().toISOString(),
          photo: personData?.profilePhotoUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to record attendance')
      }

      const result: APIResponse<any> = await response.json()
      console.log('[AttendanceAPIService] Attendance recorded:', result.data)

      // Update cache with this successful scan
      this.recentScansCache.set(cacheKey, {
        action: result.data.action,
        timestamp: Date.now()
      })

      // Clean old cache entries (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      for (const [key, value] of this.recentScansCache.entries()) {
        if (value.timestamp < fiveMinutesAgo) {
          this.recentScansCache.delete(key)
        }
      }

      // Transform API response to match AttendanceRecord interface
      return {
        id: result.data.id,
        qrCode: result.data.qrCode,
        personId: result.data.personId,
        personType: result.data.personType,
        personName: result.data.personName,
        firstName: personData?.firstName || null,
        lastName: personData?.lastName || null,
        profilePhotoUrl: result.data.profilePhoto || personData?.profilePhotoUrl || null,
        action: result.data.action,
        timestamp: new Date(result.data.timestamp),
        deviceId: result.data.deviceId,
        location: null,
        companyId: result.data.companyId
      }
    } catch (error: any) {
      console.error('[AttendanceAPIService] Failed to record attendance:', error)
      throw error
    }
  }

  /**
   * Get all attendance records for a person today (for determining next action)
   */
  async getAllAttendanceToday(personId: string): Promise<AttendanceRecord[]> {
    // This method is not needed with API approach since backend handles smart logic
    // But keep for compatibility
    return []
  }

  /**
   * Get today's attendance records
   */
  async getTodayAttendance(limit: number = 50): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/attendance/today`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AttendanceAPIService] API returned ${response.status}: ${errorText}`)

        // Don't throw error, just return empty array
        // This allows the app to continue functioning
        return []
      }

      const result: APIResponse<any[]> = await response.json()
      console.log(`[AttendanceAPIService] Fetched ${result.data.length} records for today`)

      return result.data.slice(0, limit).map(record => ({
        id: record.id,
        qrCode: record.qrCode,
        personId: record.personId,
        personType: record.personType,
        personName: record.personName,
        firstName: null,
        lastName: null,
        profilePhotoUrl: record.profilePhoto || null,
        action: record.action,
        timestamp: new Date(record.timestamp),
        deviceId: record.deviceId,
        location: null,
        companyId: record.companyId
      }))
    } catch (error: any) {
      console.error('[AttendanceAPIService] Error fetching today attendance:', error)
      return []
    }
  }

  /**
   * Get recent attendance records
   */
  async getRecentAttendance(limit: number = 100): Promise<AttendanceRecord[]> {
    // Use getTodayAttendance for now
    return this.getTodayAttendance(limit)
  }

  /**
   * Get currently checked-in people
   */
  async getCurrentlyCheckedIn(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/attendance/checked-in`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch checked-in people')
      }

      const result: APIResponse<any> = await response.json()
      console.log(`[AttendanceAPIService] Fetched ${result.data.count} checked-in people`)

      return result.data.people.map((record: any) => ({
        id: record.id,
        qrCode: '',
        personId: record.personId,
        personType: record.personType,
        personName: record.personName,
        firstName: null,
        lastName: null,
        profilePhotoUrl: null,
        action: 'check_in',
        timestamp: new Date(record.checkInDateTime),
        deviceId: record.deviceId,
        location: record.location,
        companyId: parseInt(localStorage.getItem('companyId') || '0')
      }))
    } catch (error: any) {
      console.error('[AttendanceAPIService] Error fetching checked in:', error)
      return []
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(): Promise<AttendanceStats> {
    try {
      const response = await fetch(`${API_BASE}/attendance/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch attendance stats')
      }

      const result: APIResponse<any> = await response.json()
      console.log('[AttendanceAPIService] Fetched stats:', result.data)

      return {
        todayTotal: result.data.totalRecords || 0,
        pendingSync: 0, // No pending sync with API
        lastScanTime: null, // Will be populated from recent records if needed
        checkIns: result.data.totalCheckIns || 0,
        checkOuts: result.data.totalCheckOuts || 0
      }
    } catch (error: any) {
      console.error('[AttendanceAPIService] Error fetching stats:', error)
      return {
        todayTotal: 0,
        pendingSync: 0,
        lastScanTime: null,
        checkIns: 0,
        checkOuts: 0
      }
    }
  }

  /**
   * Subscribe to realtime attendance updates
   * Note: This now returns a cleanup function that unsubscribes from WebSocket
   * WebSocket connection should be managed by component using websocketService
   */
  subscribeToAttendance(callback: (payload: any) => void) {
    console.warn('[AttendanceAPIService] subscribeToAttendance is deprecated')
    console.warn('[AttendanceAPIService] Use websocketService.subscribeToAttendance() instead')

    // Return dummy cleanup function for compatibility
    return () => {
      console.log('[AttendanceAPIService] Dummy unsubscribe called')
    }
  }
}

// Singleton instance
let attendanceServiceInstance: AttendanceAPIService | null = null

export function getAttendanceAPIService(): AttendanceAPIService {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new AttendanceAPIService()
  }
  return attendanceServiceInstance
}
