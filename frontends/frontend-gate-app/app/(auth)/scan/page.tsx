'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Scanner, ScannerHandle } from './components/Scanner'
import { useNavigationGuard } from '@/lib/hooks/useNavigationGuard'
import { playSound, cleanupAudio, resetAudio } from '@/lib/utils/sound'
import { getAttendanceSupabaseService, AttendanceRecord, AttendanceStats } from '@/lib/services/attendance-supabase.service'
import { getStorageManager, Student, Guardian } from '@/lib/utils/storage'
import { format } from 'date-fns'
import { formatLocalTime, debugTimezone } from '@/lib/utils/date'
import { AlertCircle, CheckCircle, Clock, Users, Wifi, WifiOff, RefreshCw, ExternalLink, UserCheck, Camera } from 'lucide-react'
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'
import Link from 'next/link'
import type { RealtimeChannel } from '@supabase/supabase-js'
import ScanDialog from '@/components/ui/ScanDialog'

export default function ScanPage() {
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanTime, setScanTime] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    todayTotal: 0,
    pendingSync: 0,
    lastScanTime: null,
    checkIns: 0,
    checkOuts: 0
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null)
  const [scanMessage, setScanMessage] = useState<string>('')
  const [gateName, setGateName] = useState<string>('Main Gate')
  const [isScannerActive, setIsScannerActive] = useState(true)
  const [useFrontCamera, setUseFrontCamera] = useState(false)
  const [manualInputMode, setManualInputMode] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [showScanDialog, setShowScanDialog] = useState(false)
  const [scanDialogData, setScanDialogData] = useState<{
    personName: string
    personType: 'student' | 'guardian'
    action: 'check_in' | 'check_out' | 'in' | 'out'
    timestamp: Date
    profilePhotoUrl?: string
    status: 'success' | 'error' | 'processing'
    message?: string
  } | null>(null)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)
  const scannerRef = useRef<ScannerHandle>(null)
  const attendanceSupabaseService = useRef(getAttendanceSupabaseService())
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const initializationRef = useRef<boolean>(false)
  const initializingRef = useRef<boolean>(false)
  const storageManager = getStorageManager()
  // Note: Using Supabase realtime for sync status
  const isOnline = useNetworkStatus()
  
  // Navigation guard to stop camera when leaving the page
  useNavigationGuard(async () => {
    console.log('Navigation guard: Stopping scanner before navigation')
    setIsScannerActive(false)
    if (scannerRef.current) {
      await scannerRef.current.stopScanner()
    }
    cleanupAudio()
  })

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current || initializingRef.current) {
      console.log('🔒 [ScanPage] Already initialized or initializing, skipping...')
      return
    }
    
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;
    
    const init = async () => {
      if (!mounted) return;
      
      console.log('🚀 [ScanPage] Starting init function...')
      try {
        // Ensure database is initialized first
        const { ensureDatabase } = await import('@/lib/utils/ensure-db')
        await ensureDatabase()
        
        // Reset audio when component mounts
        resetAudio()
        await storageManager.init()
        await attendanceSupabaseService.current.init()
        // Recent scans will be loaded from Supabase realtime connection
        
        // Load gate name
        const savedGateName = localStorage.getItem('gateName')
        if (savedGateName) {
          setGateName(savedGateName)
        }
        
        // Debug: Check database contents
        if (typeof window !== 'undefined') {
          const counts = await storageManager.getRecordCounts();
          console.log('Database record counts:', counts);
          
          // Auto-sync if database is empty
          if (counts.students === 0 && counts.guardians === 0) {
            console.log('Database is empty, triggering automatic sync...')
            try {
              const syncResult = await storageManager.syncFromSupabase()
              console.log('Auto-sync completed:', syncResult)
            } catch (error) {
              console.error('Auto-sync failed:', error)
            }
          }
          
          // Add global debug functions
          (window as any).debugDatabase = async () => {
            const { dbManager } = await import('@/lib/db/db-manager')
            const students = await dbManager.getAll('students', undefined, 5)
            const guardians = await dbManager.getAll('guardians', undefined, 5)
            console.log('Sample students:', students)
            console.log('Sample guardians:', guardians)
            return { students, guardians }
          }
          
          (window as any).testScan = async (qrCode: string) => {
            console.log('Testing scan for:', qrCode)
            const result = await storageManager.findByQrCode(qrCode)
            console.log('Result:', result)
            return result
          }
          
          (window as any).checkIndexes = async () => {
            const { dbManager } = await import('@/lib/db/db-manager')
            const db = (dbManager as any).db
            if (!db) {
              console.log('Database not initialized')
              return
            }
            
            const tx = db.transaction(['students', 'guardians'], 'readonly')
            const studentStore = tx.objectStore('students')
            const guardianStore = tx.objectStore('guardians')
            
            console.log('Student indexes:', Array.from(studentStore.indexNames))
            console.log('Guardian indexes:', Array.from(guardianStore.indexNames))
            
            // Check if qrCode index exists
            if (studentStore.indexNames.contains('qrCode')) {
              const index = studentStore.index('qrCode')
              console.log('Student qrCode index properties:', {
                name: index.name,
                keyPath: index.keyPath,
                unique: index.unique
              })
            }
          }
          
          // Add data sync function
          (window as any).forceDataSync = async () => {
            console.log('Forcing data sync from Supabase...')
            try {
              const syncResult = await storageManager.syncFromSupabase()
              console.log('Data sync completed:', syncResult)
              
              // Re-check database contents
              const newCounts = await storageManager.getRecordCounts()
              console.log('Updated database counts:', newCounts)
            } catch (error) {
              console.error('Data sync failed:', error)
            }
          }
          
          // Removed forceFullSync - using Supabase realtime instead
          
          console.log('Debug functions added:');
          console.log('- debugDatabase() - Check database contents');
          console.log('- testScan("student:uuid") - Test QR code lookup');
          console.log('- checkIndexes() - Check database indexes');
          console.log('- forceDataSync() - Sync students/guardians from Supabase');
          
          // Test the scan handler directly
          (window as any).testScanHandler = (data: string) => {
            console.log('Testing scan handler with:', data)
            handleScan(data)
          }
        }
        
        setIsInitialized(true)
        console.log('✅ [ScanPage] Init function completed successfully')
        return true
      } catch (error) {
        console.error('❌ [ScanPage] Failed to initialize:', error)
        return false
      }
    }
    
    // Define setupRealtime function - returns true if successful
    const setupRealtime = async (): Promise<boolean> => {
      console.log('🔌 [ScanPage] Starting realtime setup...')
      
      try {
        console.log('🔌 [ScanPage] Initializing attendance service...')
        
        // Initialize Supabase attendance service
        // Since polling works, the client is already authenticated
        await attendanceSupabaseService.current.init()
        
        console.log('🔌 [ScanPage] Creating realtime subscription...')
        
        // Subscribe to realtime attendance updates
        const channel = attendanceSupabaseService.current.subscribeToAttendance((payload) => {
          console.log('📺 [ScanPage] Received realtime attendance update:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const supabaseRecord = payload.new
            
            // Convert to local AttendanceRecord format
            const newRecord: AttendanceRecord = {
              ...supabaseRecord,
              timestamp: typeof supabaseRecord.timestamp === 'string' ? new Date(supabaseRecord.timestamp) : supabaseRecord.timestamp,
              syncStatus: 'synced' as const,
              firstName: supabaseRecord.firstName || undefined,
              lastName: supabaseRecord.lastName || undefined,
              profilePhotoUrl: supabaseRecord.profilePhotoUrl || undefined,
              deviceId: supabaseRecord.deviceId || undefined,
              location: supabaseRecord.location || undefined
            }
            
            // Add to recent scans (avoid duplicates)
            setRecentScans(prev => {
              // Check if this record already exists
              const exists = prev.some(scan => scan.id === newRecord.id)
              if (exists) return prev
              
              // Add new record at the beginning and keep max 100
              const updated = [newRecord, ...prev].slice(0, 100)
              return updated
            })
            
            // Update stats
            setStats(prev => ({
              ...prev,
              todayTotal: prev.todayTotal + 1,
              checkIns: newRecord.action === 'check_in' ? prev.checkIns + 1 : prev.checkIns,
              checkOuts: newRecord.action === 'check_out' ? prev.checkOuts + 1 : prev.checkOuts,
              lastScanTime: typeof newRecord.timestamp === 'string' ? new Date(newRecord.timestamp) : newRecord.timestamp
            }))
            
            // Play sound for new scans from other devices
            // Only play if this isn't the scan we just made
            if (newRecord.qrCode !== lastScanRef.current) {
              try {
                playSound(newRecord.action)
              } catch (error) {
                console.error('Failed to play sound:', error)
              }
            }
          }
        })
        
        if (channel) {
          console.log('🔌 [ScanPage] Channel created, checking status...')
          realtimeChannelRef.current = channel
          
          // Check the subscription status
          const status = channel.state
          console.log('📡 [ScanPage] Channel state:', status)
          
          // Add status change listener
          channel.on('system', {}, (payload) => {
            console.log('📡 [ScanPage] Channel status change:', payload)
          })
          
          setRealtimeConnected(true)
          console.log('✅ [ScanPage] Realtime subscription setup complete')
          return true  // Success
        } else {
          console.log('❌ [ScanPage] Failed to create realtime channel')
          setRealtimeConnected(false)
          return false  // Failed
        }
        
        // Always try to load initial data from Supabase
        // This works regardless of realtime connection status
        try {
          const supabaseRecent = await attendanceSupabaseService.current.getTodayAttendance(100)
          if (supabaseRecent && supabaseRecent.length > 0) {
            const formattedRecent = supabaseRecent.map(record => ({
              ...record,
              timestamp: typeof record.timestamp === 'string' ? new Date(record.timestamp) : record.timestamp,
              syncStatus: 'synced' as const,
              firstName: record.firstName || undefined,
              lastName: record.lastName || undefined,
              profilePhotoUrl: record.profilePhotoUrl || undefined,
              deviceId: record.deviceId || undefined,
              location: record.location || undefined
            }))
            setRecentScans(formattedRecent)
            
            const supabaseStats = await attendanceSupabaseService.current.getAttendanceStats()
            setStats(supabaseStats)
            
            console.log(`✅ [ScanPage] Loaded ${formattedRecent.length} records from Supabase`)
          } else {
            console.log('📋 [ScanPage] No attendance records found for today')
          }
        } catch (error) {
          console.error('❌ [ScanPage] Failed to load initial Supabase data:', error)
          // Try again after a delay
          setTimeout(() => loadRecentScans(), 2000)
        }
      } catch (error) {
        console.error('❌ [ScanPage] Failed to setup realtime:', error)
        setRealtimeConnected(false)
        return false  // Failed
      }
    }
    
    // Initialize and setup everything
    const initializeAll = async () => {
      if (!mounted) return;
      
      // Mark as initializing
      initializingRef.current = true;
      console.log('🎯 [ScanPage] Starting full initialization...')
      
      try {
        // First initialize the app
        const initSuccess = await init();
        
        // Don't check mounted here - it's causing premature exit
        // The component is still mounted, this is a React StrictMode issue
        
        if (!initSuccess) {
          console.error('❌ [ScanPage] Init failed, skipping realtime setup')
          return;
        }
        
        // Enable scanner
        setIsScannerActive(true);
        
        // Load initial recent scans
        console.log('📋 [ScanPage] Loading initial recent scans...')
        await loadRecentScans();
        
        // Then setup realtime
        console.log('🔌 [ScanPage] About to call setupRealtime...')
        const realtimeSuccess = await setupRealtime().catch(err => {
          console.error('❌ [ScanPage] setupRealtime failed with error:', err)
          return false;
        });
        
        // Only set up periodic refresh if realtime is NOT connected
        // This prevents unnecessary polling when realtime is working
        if (!realtimeSuccess || !realtimeChannelRef.current) {
          console.log('⚠️ [ScanPage] Realtime not available, enabling polling fallback...')
          refreshInterval = setInterval(() => {
            // Only poll if realtime is still not connected
            if (!realtimeConnected) {
              console.log('🔄 [ScanPage] Periodic refresh of recent scans (realtime not connected)...')
              loadRecentScans()
            }
          }, 5000);
        } else {
          console.log('✅ [ScanPage] Realtime connected, polling disabled')
        }
        
        // Mark as fully initialized
        initializationRef.current = true;
        initializingRef.current = false;
        console.log('🎉 [ScanPage] Full initialization complete!')
      } catch (error) {
        console.error('❌ [ScanPage] Error during initialization:', error)
        initializingRef.current = false;
      }
    }
    
    // Start initialization
    initializeAll();
    
    // Cleanup when component unmounts
    return () => {
      mounted = false;
      setIsScannerActive(false)
      cleanupAudio()
      
      // Clear refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      
      // Unsubscribe from realtime
      if (realtimeChannelRef.current) {
        console.log('🔌 [ScanPage] Unsubscribing from realtime...')
        realtimeChannelRef.current.unsubscribe()
        realtimeChannelRef.current = null
      }
    }
  }, [])

  // Monitor realtime connection state and manage polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (!isInitialized) return;
    
    if (realtimeConnected) {
      console.log('🟢 [ScanPage] Realtime is connected, stopping any polling')
      // Clear any existing polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } else {
      console.log('🔴 [ScanPage] Realtime disconnected, starting polling fallback')
      // Start polling as fallback
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          console.log('🔄 [ScanPage] Polling for updates (realtime disconnected)...')
          loadRecentScans()
        }, 5000);
      }
    }
    
    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    }
  }, [realtimeConnected, isInitialized])

  // Realtime updates are handled by Supabase subscription above

  const loadRecentScans = async () => {
    console.log('📊 [loadRecentScans] Loading recent scans from Supabase...')
    try {
      // Try to load from Supabase regardless of realtime connection status
      // This allows us to show recent scans even if realtime is not working
      try {
        const supabaseRecent = await attendanceSupabaseService.current.getTodayAttendance(100)
        console.log(`📊 [loadRecentScans] Received ${supabaseRecent?.length || 0} records from Supabase`)
        if (supabaseRecent && supabaseRecent.length > 0) {
          // Convert timestamps to Date objects
          const formattedRecent = supabaseRecent.map(record => ({
            ...record,
            timestamp: typeof record.timestamp === 'string' ? new Date(record.timestamp) : record.timestamp,
            syncStatus: 'synced' as const,
            firstName: record.firstName || undefined,
            lastName: record.lastName || undefined,
            profilePhotoUrl: record.profilePhotoUrl || undefined,
            deviceId: record.deviceId || undefined,
            location: record.location || undefined
          }))
          
          // Only update if different from current state (avoid unnecessary re-renders)
          setRecentScans(prev => {
            // Check if the data has actually changed
            if (prev.length !== formattedRecent.length || 
                (prev.length > 0 && formattedRecent.length > 0 && prev[0].id !== formattedRecent[0].id)) {
              console.log(`📊 [ScanPage] Updated recent scans: ${formattedRecent.length} records`)
              return formattedRecent
            }
            return prev
          })
          
          // Get stats from Supabase
          const supabaseStats = await attendanceSupabaseService.current.getAttendanceStats()
          setStats(supabaseStats)
        } else {
          // No records from Supabase
          console.log('No attendance records found for today')
          setRecentScans([])
          setStats({
            todayTotal: 0,
            pendingSync: 0,
            lastScanTime: null,
            checkIns: 0,
            checkOuts: 0
          })
        }
      } catch (error) {
        // Only log errors occasionally to avoid spam during periodic refresh
        if (Math.random() < 0.1) { // Log 10% of errors
          console.error('❌ [ScanPage] Failed to load from Supabase:', error)
        }
      }
      
    } catch (error) {
      console.error('Failed to load recent scans:', error)
    }
  }


  const handleScan = useCallback(async (data: string) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now()
    if (data === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
      console.log('Duplicate scan prevented:', data)
      return
    }

    console.log('=== SCAN DEBUG START ===')
    console.log('Raw scan data:', data)
    console.log('Data type:', typeof data)
    console.log('Data length:', data.length)

    // Update refs
    lastScanRef.current = data
    lastScanTimeRef.current = now

    // Process scanned data
    const currentTime = new Date()
    setLastScanned(data)
    setScanTime(format(currentTime, 'h:mm:ss a'))
    
    // Parse QR code format: "student:{uuid}" or "guardian:{uuid}"
    const [type, id] = data.split(':')
    let personData: Student | Guardian | null = null
    
    try {
      // First check database contents
      const counts = await storageManager.getRecordCounts()
      console.log('Current database counts:', counts)
      console.log('Parsed QR code - Type:', type, 'ID:', id)
      
      if (!['student', 'guardian'].includes(type) || !id) {
        console.error('Invalid QR format - Type:', type, 'ID:', id)
        setScanStatus('error')
        setScanMessage('Invalid QR code format')
        playSound('error')
        setTimeout(() => setScanStatus(null), 3000)
        return
      }

      // Look up person in IndexedDB using QR code
      console.log('Looking up in IndexedDB:', data)
      
      // Try direct database query for debugging
      if (typeof window !== 'undefined') {
        const { dbManager } = await import('@/lib/db/db-manager')
        if (type === 'student') {
          const allStudents = await dbManager.getAll<Student>('students', undefined, 5)
          console.log('Sample students in DB:', allStudents)
          console.log('First student qrCode:', allStudents[0]?.qrCode)
        } else if (type === 'guardian') {
          const allGuardians = await dbManager.getAll<Guardian>('guardians', undefined, 5)
          console.log('Sample guardians in DB:', allGuardians)
          console.log('First guardian qrCode:', allGuardians[0]?.qrCode)
        }
      }
      
      personData = await storageManager.findByQrCode(data)
      console.log('Person data found:', personData)
      console.log('=== SCAN DEBUG END ===')
      
      if (!personData) {
        console.error('Person not found in IndexedDB for QR:', data)
        setScanStatus('error')
        setScanMessage(`${type === 'student' ? 'Student' : 'Guardian'} not found in local database`)
        playSound('error')
        
        // Show error dialog
        setScanDialogData({
          personName: 'Unknown Person',
          personType: type as 'student' | 'guardian',
          action: 'in',
          timestamp: currentTime,
          status: 'error',
          message: `${type === 'student' ? 'Student' : 'Guardian'} not found in local database`
        })
        setShowScanDialog(true)
        
        setTimeout(() => setScanStatus(null), 3000)
        return
      }
      
      // IMMEDIATE FEEDBACK: Play recognition sound as soon as person is found
      playSound('recognition')
      
      // Construct full name from first and last name
      const fullName = `${personData.firstName} ${personData.lastName}`
      
      // Show processing dialog immediately
      setScanDialogData({
        personName: fullName,
        personType: type as 'student' | 'guardian',
        action: 'in', // Will be updated after record is created
        timestamp: currentTime,
        profilePhotoUrl: personData.profilePhotoUrl || undefined,
        status: 'processing',
        message: 'Recording attendance...'
      })
      setShowScanDialog(true)

      // Record attendance directly to Supabase
      console.log('Recording attendance for:', personData)
      const record = await attendanceSupabaseService.current.recordAttendance(data, personData)
      console.log('Attendance record created:', record)
      debugTimezone(record.timestamp, 'New attendance record')
      
      // Play confirmation sound based on action
      playSound(record.action)
      
      // Update dialog with success status
      setScanDialogData({
        personName: record.personName,
        personType: type as 'student' | 'guardian',
        action: record.action,
        timestamp: new Date(record.timestamp),
        profilePhotoUrl: personData.profilePhotoUrl || undefined,
        status: 'success'
      })
      
      setScanStatus('success')
      setScanMessage(`${record.personName} - ${record.action === 'check_in' ? 'Checked In' : 'Checked Out'}`)
      
      // Reload recent scans and stats
      await loadRecentScans()
      
      // Data automatically syncs to Supabase in realtime
      
      // Clear status after 3 seconds
      setTimeout(() => setScanStatus(null), 3000)
      
    } catch (error) {
      console.error('Scan error:', error)
      setScanStatus('error')
      setScanMessage('Failed to process scan')
      playSound('error')
      
      // Show error dialog
      const errorName = personData ? `${personData.firstName} ${personData.lastName}` : 'Unknown Person'
      setScanDialogData({
        personName: errorName,
        personType: type as 'student' | 'guardian',
        action: 'in',
        timestamp: currentTime,
        status: 'error',
        message: 'Failed to process scan. Please try again.'
      })
      setShowScanDialog(true)
      
      setTimeout(() => setScanStatus(null), 3000)
    }
  }, [])

  // Toggle between camera and manual input modes
  const handleToggleMode = () => {
    setManualInputMode(!manualInputMode)
    console.log('Switching to', !manualInputMode ? 'manual' : 'camera', 'mode')
  }

  console.log('ScanPage rendering, isInitialized:', isInitialized)
  
  return (
    <div className="mx-auto max-w-6xl">
      {/* Stats - Moved to top */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Total</p>
                <p className="text-3xl font-bold">{stats.todayTotal}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Check In/Out</p>
              <p className="text-2xl font-bold">
                <span className="text-green-600">{stats.checkIns}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-red-600">{stats.checkOuts}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Scan</p>
                <p className="text-lg font-bold" suppressHydrationWarning>
                  {stats.lastScanTime ? format(stats.lastScanTime, 'h:mm:ss a') : 'No scans'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/checked-in" className="block">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">View Checked In</p>
                  <p className="text-base font-semibold text-blue-600">See List →</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Camera View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Scanner {manualInputMode && '- Manual Input'}
              </CardTitle>
              <div className="flex items-center space-x-4">
                {/* Camera Selection - only show when in camera mode */}
                {!manualInputMode && (
                  <div className="flex items-center space-x-2 camera-selection-control">
                    <Camera className="h-4 w-4 text-gray-600" />
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useFrontCamera}
                        onChange={(e) => setUseFrontCamera(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span>Front Camera</span>
                    </label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">
                    Gate: <span className="text-gray-900">{gateName}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-900">
              <Scanner 
                ref={scannerRef} 
                onScan={handleScan} 
                isActive={isScannerActive} 
                useFrontCamera={useFrontCamera}
                manualInputMode={manualInputMode}
                onToggleMode={handleToggleMode}
              />
            </div>
            
            {/* Sync Status - Under Camera */}
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Offline Mode:</strong> All scans are saved locally and will sync when connected.
                </p>
              </div>
              
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {realtimeConnected ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : isOnline ? (
                      <Wifi className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {realtimeConnected ? 'Live Updates' : isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {realtimeConnected && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Live updates enabled - changes appear instantly
                  </p>
                )}
                
                {!realtimeConnected && isOnline && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Connecting to live updates...
                  </p>
                )}
                
                {!isOnline && (
                  <p className="text-xs text-gray-500 mt-2">
                    Offline - scans saved locally
                  </p>
                )}
              </div>
            </div>
            
            {scanStatus && (
              <div className={`mt-4 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 ${
                scanStatus === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {scanStatus === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        scanStatus === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {scanStatus === 'success' ? 'Successfully Scanned' : 'Scan Error'}
                      </p>
                      <p className={`text-lg font-semibold ${
                        scanStatus === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {scanMessage}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm ${
                    scanStatus === 'success' ? 'text-green-700' : 'text-red-700'
                  }`} suppressHydrationWarning>
                    {scanTime}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Recent Scans</CardTitle>
                {realtimeConnected && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <Link 
                href="/synced-data" 
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View All
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No scans recorded today</p>
                </div>
              ) : (
                recentScans.map((scan, index) => (
                  <div
                    key={scan.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                      index === 0 && new Date(scan.timestamp).getTime() > Date.now() - 5000
                        ? 'border-green-500 bg-green-50 animate-in fade-in slide-in-from-top-2' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        <img 
                          src={scan.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.personName)}&background=${scan.personType === 'student' ? '3b82f6' : '10b981'}&color=ffffff&size=128&font-size=0.5&rounded=true`} 
                          alt={scan.personName}
                          className="w-16 h-16 object-cover rounded-full"
                        />
                      </div>
                      
                      {/* Person Info */}
                      <div>
                        <p className="font-semibold">{scan.personName}</p>
                        <p className="text-sm text-gray-600">
                          {scan.personType === 'student' ? 'Student' : 'Guardian'}
                          {scan.location && <span className="ml-2">• {scan.location}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" suppressHydrationWarning>
                        {format(new Date(scan.timestamp), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600" suppressHydrationWarning>
                        {format(new Date(scan.timestamp), 'h:mm:ss a')}
                      </p>
                      <p className={`text-sm font-semibold ${
                        scan.action === 'check_in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scan.action === 'check_in' ? 'Check In' : 'Check Out'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Scan Dialog */}
      <ScanDialog
        isOpen={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        data={scanDialogData}
        autoCloseDuration={3000}
      />
    </div>
  )
}