'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { getAttendanceSupabaseService, AttendanceRecord } from '@/lib/services/attendance-supabase.service'
import { CheckCircle2, LogOut, Clock, Users, UserCheck, GraduationCap, User, Camera } from 'lucide-react'
import { playBeep } from '@/lib/utils/sound'
import styles from './tv.module.css'

interface DisplayRecord extends AttendanceRecord {
  personDetails?: {
    firstName: string
    lastName: string
    middleName?: string
    studentNumber?: string
    email?: string
    gender?: string
  }
}

export default function TVPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [latestScan, setLatestScan] = useState<DisplayRecord | null>(null)
  const [recentScans, setRecentScans] = useState<DisplayRecord[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [stats, setStats] = useState({
    totalToday: 0,
    studentsPresent: 0,
    guardiansPresent: 0,
    checkIns: 0,
    checkOuts: 0
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const attendanceService = useRef(getAttendanceSupabaseService())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Supabase real-time subscription
  useEffect(() => {
    let subscription: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('🔌 [TVPage] Setting up Supabase realtime subscription...')
        
        // Initialize service
        await attendanceService.current.init()
        
        // Subscribe to real-time attendance updates
        subscription = attendanceService.current.subscribeToAttendance((payload: any) => {
          console.log('📺 [TVPage] Received realtime attendance update:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const data = payload.new
            
            // Convert Supabase data to DisplayRecord format
            const newRecord: DisplayRecord = {
              id: data.id,
              qrCode: data.qrCode,
              personId: data.personId,
              personType: data.personType,
              personName: data.personName || 'Unknown',
              firstName: data.firstName,
              lastName: data.lastName,
              profilePhotoUrl: data.profilePhotoUrl,
              action: data.action,
              timestamp: new Date(data.timestamp),
              deviceId: data.deviceId,
              location: data.location,
              companyId: data.companyId,
              personDetails: data.firstName && data.lastName ? {
                firstName: data.firstName,
                lastName: data.lastName,
                studentNumber: data.personType === 'student' ? data.personId : undefined,
              } : undefined
            }

            // Update latest scan with animation
            setLatestScan(prev => {
              // Only update if this is a newer scan
              if (!prev || new Date(data.timestamp) > new Date(prev.timestamp)) {
                setShowAnimation(true)
                setTimeout(() => setShowAnimation(false), 3000)
                
                // Play sound for new scan
                try {
                  playBeep()
                } catch (e) {
                  console.error('Could not play sound:', e)
                }
                
                return newRecord
              }
              return prev
            })

            // Update recent scans list
            setRecentScans(prev => {
              const filtered = prev.filter(scan => scan.id !== data.id)
              return [newRecord, ...filtered].slice(0, 6)
            })

            // Refresh data to update stats
            loadAttendanceData()
          }
        })
        
        console.log('✅ [TVPage] Supabase subscription setup successfully')

      } catch (error) {
        console.error('❌ [TVPage] Failed to setup Supabase subscription:', error)
      }
    }

    setupRealtimeSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Load attendance data from Supabase
  const loadAttendanceData = async () => {
    try {
      // Get today's attendance records
      const records = await attendanceService.current.getTodayAttendance(50)
      
      // Convert records to DisplayRecord format with person details
      const recordsWithDetails: DisplayRecord[] = records.map((record) => ({
        ...record,
        timestamp: new Date(record.timestamp),
        personDetails: record.firstName && record.lastName ? {
          firstName: record.firstName,
          lastName: record.lastName,
          studentNumber: record.personType === 'student' ? record.personId : undefined,
        } : undefined
      } as DisplayRecord))

      // Update latest scan if there's a new one
      if (recordsWithDetails.length > 0 && recordsWithDetails[0].id !== latestScan?.id) {
        setLatestScan(recordsWithDetails[0])
        setShowAnimation(true)
        setTimeout(() => setShowAnimation(false), 2000)
        
        // Play sound for new scan
        try {
          playBeep()
        } catch (e) {
          console.error('Could not play sound:', e)
        }
      }

      setRecentScans(recordsWithDetails.slice(1, 7))

      // Get stats
      const stats = await attendanceService.current.getAttendanceStats()
      
      // Calculate students and guardians present
      const studentCheckIns = records.filter(r => r.personType === 'student' && r.action === 'check_in').length
      const guardianCheckIns = records.filter(r => r.personType === 'guardian' && r.action === 'check_in').length

      setStats({
        totalToday: stats.todayTotal,
        studentsPresent: studentCheckIns,
        guardiansPresent: guardianCheckIns,
        checkIns: stats.checkIns,
        checkOuts: stats.checkOuts
      })
    } catch (error) {
      console.error('Failed to load attendance data:', error)
    }
  }

  // Initial load and periodic updates
  useEffect(() => {
    loadAttendanceData()
    
    // Refresh every 2 seconds
    intervalRef.current = setInterval(loadAttendanceData, 2000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getInitials = (person: DisplayRecord) => {
    if (person.personDetails) {
      const { firstName, lastName } = person.personDetails
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
    }
    return person.personName.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getPersonImage = (person: DisplayRecord): string | null => {
    // Check for profile photo URL
    if (person.profilePhotoUrl && typeof person.profilePhotoUrl === 'string') {
      return person.profilePhotoUrl
    }
    
    // Check for person details profile photo
    if (person.personDetails && 'profilePhotoUrl' in person.personDetails && 
        typeof person.personDetails.profilePhotoUrl === 'string') {
      return person.personDetails.profilePhotoUrl
    }
    
    return null
  }

  const PersonAvatar = ({ person, size = 'large', className = '' }: { 
    person: DisplayRecord, 
    size?: 'small' | 'large',
    className?: string 
  }) => {
    const imageUrl = getPersonImage(person)
    const sizeClasses = size === 'large' ? 'h-48 w-48 text-7xl' : 'h-12 w-12 text-lg'
    
    if (imageUrl) {
      return (
        <div className={`relative ${sizeClasses} ${className}`}>
          <img
            src={imageUrl}
            alt={getFullName(person)}
            className={`${sizeClasses} rounded-full object-cover border-4 border-white shadow-2xl`}
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div 
            className={`hidden ${sizeClasses} items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-2xl`}
          >
            {getInitials(person)}
          </div>
        </div>
      )
    }
    
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-2xl`}>
        {getInitials(person)}
      </div>
    )
  }

  const getFullName = (person: DisplayRecord) => {
    if (person.personDetails) {
      const { firstName, lastName, middleName } = person.personDetails
      return `${lastName || ''}, ${firstName || ''} ${middleName?.[0] ? middleName[0] + '.' : ''}`.trim()
    }
    return person.personName
  }

  const getPersonIcon = (type: string) => {
    return type === 'student' ? GraduationCap : User
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${styles['gradient-animation']} ${isFullscreen ? 'p-8' : 'p-4'}`}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">School Gatekeep</h1>
          <p className="text-xl text-gray-600">Live Attendance Monitor</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-lg text-gray-600">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
          <Button onClick={toggleFullscreen} variant="outline" size="lg">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Latest Scan - Main Focus */}
        <div className="lg:col-span-8">
          <Card className={`h-full overflow-hidden shadow-2xl ${showAnimation ? styles['scan-highlight'] : ''}`}>
            <CardContent className="p-0">
              {latestScan ? (
                <div className={`relative h-full transition-all duration-500 ${showAnimation ? `scale-105 ${styles['slide-in-up']}` : 'scale-100'}`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10"></div>
                  
                  <div className="relative p-12">
                    {/* Person Info */}
                    <div className="flex items-center gap-12">
                      {/* Avatar */}
                      <div className={`relative ${showAnimation ? styles['zoom-in'] : ''}`}>
                        <PersonAvatar 
                          person={latestScan} 
                          size="large" 
                          className={showAnimation ? styles['pulse-ring'] : ''} 
                        />
                        <div className="absolute -bottom-2 -right-2">
                          {latestScan.action === 'check_in' ? (
                            <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-lg bg-white rounded-full p-1" />
                          ) : (
                            <LogOut className="h-16 w-16 text-red-500 drop-shadow-lg bg-white rounded-full p-1" />
                          )}
                        </div>
                        {/* Camera icon overlay for photos */}
                        {getPersonImage(latestScan) && (
                          <div className="absolute top-2 right-2">
                            <Camera className="h-8 w-8 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <h2 className="text-5xl font-bold text-gray-800 mb-4">
                          {getFullName(latestScan)}
                        </h2>
                        
                        <div className="flex items-center gap-6 text-2xl text-gray-600 mb-6">
                          <div className="flex items-center gap-2">
                            {getPersonIcon(latestScan.personType) === GraduationCap ? (
                              <GraduationCap className="h-8 w-8" />
                            ) : (
                              <User className="h-8 w-8" />
                            )}
                            <span className="capitalize">{latestScan.personType}</span>
                          </div>
                          {latestScan.personDetails?.studentNumber && (
                            <div className="text-gray-500">
                              ID: {latestScan.personDetails.studentNumber}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-8">
                          <div className={`inline-flex items-center gap-3 rounded-full px-8 py-4 text-2xl font-bold transition-all duration-300 ${showAnimation ? 'scale-110' : 'scale-100'} ${
                            latestScan.action === 'check_in' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {latestScan.action === 'check_in' ? (
                              <>
                                <CheckCircle2 className="h-8 w-8" />
                                CHECKED IN
                              </>
                            ) : (
                              <>
                                <LogOut className="h-8 w-8" />
                                CHECKED OUT
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-2xl text-gray-600">
                            <Clock className="h-8 w-8" />
                            {format(new Date(latestScan.timestamp), 'h:mm:ss a')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mt-8 text-center text-xl text-gray-600">
                      <span className="font-semibold">Location:</span> {latestScan.location || 'Main Gate'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-12">
                  <div className="text-center">
                    <div className="mb-4 text-6xl text-gray-400">👋</div>
                    <h3 className="text-3xl font-semibold text-gray-600">Waiting for scans...</h3>
                    <p className="mt-2 text-xl text-gray-500">Scan a QR code to see attendance</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Recent Activity & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity */}
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <h3 className="mb-4 text-2xl font-semibold text-gray-800">Recent Activity</h3>
              <div className="space-y-3">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <div className="relative">
                        <PersonAvatar person={scan} size="small" />
                        {getPersonImage(scan) && (
                          <div className="absolute -top-1 -right-1">
                            <Camera className="h-3 w-3 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{getFullName(scan)}</p>
                        <p className="text-sm text-gray-600">
                          {scan.personType} • {format(new Date(scan.timestamp), 'h:mm a')}
                        </p>
                      </div>
                      <div className={`flex-shrink-0 ${
                        scan.action === 'check_in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scan.action === 'check_in' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <LogOut className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 grid-cols-2">
            <Card className="shadow-xl">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-gray-600">Total Today</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalToday}</p>
              </CardContent>
            </Card>
            <Card className="shadow-xl">
              <CardContent className="p-6 text-center">
                <GraduationCap className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.studentsPresent}</p>
              </CardContent>
            </Card>
            <Card className="shadow-xl">
              <CardContent className="p-6 text-center">
                <UserCheck className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-600">Check-ins</p>
                <p className="text-3xl font-bold text-green-600">{stats.checkIns}</p>
              </CardContent>
            </Card>
            <Card className="shadow-xl">
              <CardContent className="p-6 text-center">
                <LogOut className="mx-auto h-8 w-8 text-red-600 mb-2" />
                <p className="text-sm font-medium text-gray-600">Check-outs</p>
                <p className="text-3xl font-bold text-red-600">{stats.checkOuts}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}