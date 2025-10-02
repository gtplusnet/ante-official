import { getSupabaseService } from './supabase.service';
import { v4 as uuidv4 } from 'uuid';

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

export class AttendanceSupabaseService {
  private supabaseService = getSupabaseService()
  private recentScansCache = new Map<string, { action: string, timestamp: number }>() // Local cache to prevent race conditions

  async init(): Promise<void> {
    // Initialize Supabase client if not already done
    const client = this.supabaseService.getClient()
    if (!client) {
      throw new Error('Supabase client not initialized')
    }
    console.log('[AttendanceSupabaseService] Initialized')
  }

  async recordAttendance(qrCode: string, personData: any): Promise<AttendanceRecord> {
    const client = this.supabaseService.getClient()
    if (!client) throw new Error('Supabase client not initialized')

    // Parse QR code to get person type and ID
    const [personType, personId] = qrCode.split(':') as ['student' | 'guardian', string]
    
    // Check local cache first to prevent race conditions
    const cacheKey = `${personId}-${new Date().toDateString()}`
    const cachedScan = this.recentScansCache.get(cacheKey)
    const currentTimeMs = Date.now()
    
    // If scanned within last 10 seconds, reject to prevent duplicates
    if (cachedScan && (currentTimeMs - cachedScan.timestamp) < 10000) {
      console.log(`[AttendanceSupabaseService] Scan throttled - ${personData?.lastName} was scanned ${Math.round((currentTimeMs - cachedScan.timestamp) / 1000)}s ago`)
      throw new Error('Please wait 10 seconds before scanning the same person again')
    }
    
    // Get ALL attendance records for this person today
    const allRecordsToday = await this.getAllAttendanceToday(personId)
    console.log(`[AttendanceSupabaseService] Found ${allRecordsToday.length} records for ${personId} today`)
    
    // Determine action based on ALL records with proper logic
    let action: 'check_in' | 'check_out' = 'check_in'
    
    if (allRecordsToday.length > 0) {
      // Count check-ins and check-outs
      const checkIns = allRecordsToday.filter(r => r.action === 'check_in').length
      const checkOuts = allRecordsToday.filter(r => r.action === 'check_out').length
      
      console.log(`[AttendanceSupabaseService] Person ${personId}: ${checkIns} check-ins, ${checkOuts} check-outs today`)
      
      // Determine next action based on balance - strict alternation
      if (checkIns > checkOuts) {
        // More check-ins than check-outs, so person is currently "in"
        // Next action MUST be check-out
        action = 'check_out'
      } else {
        // Equal check-ins and check-outs, person is currently "out"
        // Next action MUST be check-in
        action = 'check_in'
      }
    }
    
    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    const recordId = uuidv4()
    
    // Create attendance record object for Supabase (matching actual schema)
    const now = new Date().toISOString()
    const attendanceRecord = {
      id: recordId,
      qrCode,
      personId,
      personType,
      personName: personData ? `${personData.lastName}, ${personData.firstName}` : 'Unknown',
      action,
      timestamp: now,
      deviceId: localStorage.getItem('deviceId') || null,
      location: localStorage.getItem('gateName') || 'Main Gate',
      companyId,
      profilePhoto: personData?.profilePhotoUrl || null, // Note: schema uses 'profilePhoto' not 'profilePhotoUrl'
      syncedAt: now, // Mark as synced immediately since we're writing directly
      createdAt: now, // Required field
      updatedAt: now  // Required field
    }

    // Insert directly to Supabase
    const { data, error } = await client
      .from('SchoolAttendance')
      .insert(attendanceRecord as any) // Type assertion needed due to Supabase client typing
      .select()
      .single()

    if (error) {
      console.error('[AttendanceSupabaseService] Failed to record attendance:', error)
      throw new Error(`Failed to record attendance: ${error.message}`)
    }

    console.log('[AttendanceSupabaseService] Attendance recorded successfully:', data)
    
    // Broadcast the attendance update to realtime channel for Guardian App
    await this.broadcastAttendanceUpdate(data, personData)
    
    // Return the created record with proper typing
    if (!data) {
      throw new Error('No data returned from Supabase insert')
    }
    
    // Update cache with this successful scan
    this.recentScansCache.set(cacheKey, {
      action: action,
      timestamp: Date.now()
    })
    
    // Clean old cache entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    for (const [key, value] of this.recentScansCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.recentScansCache.delete(key)
      }
    }
    
    // Type assertion for the returned data
    const recordData = data as any
    
    return {
      id: recordData.id,
      qrCode: recordData.qrCode,
      personId: recordData.personId,
      personType: recordData.personType,
      personName: recordData.personName,
      firstName: null, // Not in database schema, but needed for interface
      lastName: null, // Not in database schema, but needed for interface
      profilePhotoUrl: recordData.profilePhoto, // Map from schema's 'profilePhoto' to interface's 'profilePhotoUrl'
      action: recordData.action,
      timestamp: new Date(recordData.timestamp),
      deviceId: recordData.deviceId,
      location: recordData.location,
      companyId: recordData.companyId
    } as AttendanceRecord
  }

  async getAllAttendanceToday(personId: string): Promise<AttendanceRecord[]> {
    const client = this.supabaseService.getClient()
    if (!client) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('personId', personId)
      .eq('companyId', companyId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: true }) // Get chronological order

    if (error) {
      console.error('[AttendanceSupabaseService] Error fetching attendance records:', error)
      return []
    }

    return data || []
  }

  async getTodayAttendance(limit: number = 50): Promise<AttendanceRecord[]> {
    const client = this.supabaseService.getClient()
    if (!client) {
      console.error('[AttendanceSupabaseService] No Supabase client available')
      return []
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    console.log('[AttendanceSupabaseService] Fetching attendance for companyId:', companyId)

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('companyId', companyId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AttendanceSupabaseService] Error fetching today attendance:', error)
      return []
    }

    return data || []
  }

  async getRecentAttendance(limit: number = 100): Promise<AttendanceRecord[]> {
    const client = this.supabaseService.getClient()
    if (!client) return []

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('companyId', companyId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AttendanceSupabaseService] Error fetching recent attendance:', error)
      return []
    }

    console.log(`[AttendanceSupabaseService] Fetched ${data?.length || 0} recent records`)
    return data || []
  }

  async getCurrentlyCheckedIn(): Promise<AttendanceRecord[]> {
    const client = this.supabaseService.getClient()
    if (!client) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

    // Get all records for today
    const { data, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('companyId', companyId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[AttendanceSupabaseService] Error fetching checked in:', error)
      return []
    }

    // Group by personId and get latest status for each person
    const personStatusMap = new Map<string, AttendanceRecord>()
    
    for (const record of data || []) {
      const attendanceRecord = record as AttendanceRecord
      const existing = personStatusMap.get(attendanceRecord.personId)
      if (!existing || new Date(attendanceRecord.timestamp) > new Date(existing.timestamp)) {
        personStatusMap.set(attendanceRecord.personId, attendanceRecord)
      }
    }
    
    // Filter only those who are checked in
    const checkedIn = Array.from(personStatusMap.values())
      .filter(record => record.action === 'check_in')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return checkedIn
  }

  async getAttendanceStats(): Promise<AttendanceStats> {
    const client = this.supabaseService.getClient()
    if (!client) {
      return {
        todayTotal: 0,
        pendingSync: 0,
        lastScanTime: null,
        checkIns: 0,
        checkOuts: 0
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const companyId = parseInt(localStorage.getItem('companyId') || '0')

    // Get today's records
    const { data: todayRecords, error } = await client
      .from('SchoolAttendance')
      .select('*')
      .eq('companyId', companyId)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[AttendanceSupabaseService] Error fetching stats:', error)
      return {
        todayTotal: 0,
        pendingSync: 0,
        lastScanTime: null,
        checkIns: 0,
        checkOuts: 0
      }
    }

    let checkIns = 0
    let checkOuts = 0
    let lastScanTime: Date | null = null

    for (const record of todayRecords || []) {
      const attendanceRecord = record as AttendanceRecord
      if (attendanceRecord.action === 'check_in') checkIns++
      else checkOuts++
      
      const recordTime = new Date(attendanceRecord.timestamp)
      if (!lastScanTime || recordTime > lastScanTime) {
        lastScanTime = recordTime
      }
    }

    return {
      todayTotal: todayRecords?.length || 0,
      pendingSync: 0, // No pending sync with direct Supabase
      lastScanTime,
      checkIns,
      checkOuts
    }
  }

  // Subscribe to realtime attendance updates
  subscribeToAttendance(callback: (payload: any) => void) {
    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    console.log('[AttendanceSupabaseService] Setting up realtime for company:', companyId)
    
    const client = this.supabaseService.getClient()
    if (!client) {
      console.error('[AttendanceSupabaseService] No Supabase client available')
      return null
    }
    
    const channelName = `attendance-${companyId}`
    console.log('[AttendanceSupabaseService] Creating channel:', channelName)
    
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SchoolAttendance',
          filter: `companyId=eq.${companyId}`
        },
        (payload) => {
          console.log('[AttendanceSupabaseService] New attendance record:', payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        console.log('[AttendanceSupabaseService] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[AttendanceSupabaseService] Successfully subscribed to realtime')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[AttendanceSupabaseService] Channel error - check authentication')
        } else if (status === 'TIMED_OUT') {
          console.error('[AttendanceSupabaseService] Subscription timed out')
        }
      })
    
    return channel
  }

  // Broadcast attendance update to Guardian App via realtime channel
  private async broadcastAttendanceUpdate(attendanceRecord: any, personData: any): Promise<void> {
    const client = this.supabaseService.getClient()
    if (!client) {
      console.warn('[AttendanceSupabaseService] No client available for broadcast')
      return
    }

    const companyId = parseInt(localStorage.getItem('companyId') || '0')
    const channelName = `attendance-updates-${companyId}`
    
    try {
      // Create broadcast payload with attendance data
      const broadcastPayload = {
        eventType: 'attendance_recorded',
        attendanceRecord: {
          id: attendanceRecord.id,
          personId: attendanceRecord.personId,
          personType: attendanceRecord.personType,
          personName: attendanceRecord.personName,
          action: attendanceRecord.action,
          timestamp: attendanceRecord.timestamp,
          location: attendanceRecord.location,
          deviceId: attendanceRecord.deviceId,
          companyId: attendanceRecord.companyId
        },
        personData: personData ? {
          firstName: personData.firstName,
          lastName: personData.lastName,
          profilePhotoUrl: personData.profilePhotoUrl
        } : null,
        timestamp: new Date().toISOString(),
        source: 'gate-app'
      }

      const channel = client.channel(channelName)
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'attendance_update',
        payload: broadcastPayload
      })
      
      console.log('[AttendanceSupabaseService] Broadcast sent:', {
        channel: channelName,
        personId: attendanceRecord.personId,
        action: attendanceRecord.action,
        result: result
      })
      
    } catch (error) {
      console.error('[AttendanceSupabaseService] Failed to broadcast attendance update:', error)
    }
  }
}

// Singleton instance
let attendanceServiceInstance: AttendanceSupabaseService | null = null

export function getAttendanceSupabaseService(): AttendanceSupabaseService {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new AttendanceSupabaseService()
  }
  return attendanceServiceInstance
}