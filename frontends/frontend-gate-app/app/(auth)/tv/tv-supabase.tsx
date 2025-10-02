'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { CheckCircle2, LogOut, Clock, Users, UserCheck, GraduationCap, User, Wifi, WifiOff } from 'lucide-react'
import { playSound } from '@/lib/utils/sound'
import { getAttendanceSupabaseService } from '@/lib/services/attendance-supabase.service'
import { getSyncSupabaseService } from '@/lib/services/sync-supabase.service'
import styles from './tv.module.css'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface DisplayRecord {
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
}

export default function TVSupabasePage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [latestScan, setLatestScan] = useState<DisplayRecord | null>(null)
  const [recentScans, setRecentScans] = useState<DisplayRecord[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [stats, setStats] = useState({
    totalToday: 0,
    studentsPresent: 0,
    guardiansPresent: 0,
    checkIns: 0,
    checkOuts: 0
  })
  
  const attendanceService = useRef(getAttendanceSupabaseService())
  const syncService = useRef(getSyncSupabaseService())
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load initial data and setup realtime subscription
  useEffect(() => {
    let subscription: RealtimeChannel | undefined

    const setupRealtimeAndLoadData = async () => {
      try {
        setConnectionStatus('connecting')
        console.log('🔌 [TVSupabase] Setting up Supabase realtime...')
        
        // Initialize services
        await attendanceService.current.init()
        await syncService.current.init()
        
        // Load today's attendance
        const todayAttendance = await attendanceService.current.getTodayAttendance(50)
        setRecentScans(todayAttendance.slice(0, 10))
        
        if (todayAttendance.length > 0) {
          setLatestScan(todayAttendance[0])
        }
        
        // Calculate stats
        const stats = await attendanceService.current.getAttendanceStats()
        setStats({
          totalToday: stats.todayTotal,
          studentsPresent: 0, // Will calculate from data
          guardiansPresent: 0, // Will calculate from data
          checkIns: stats.checkIns,
          checkOuts: stats.checkOuts
        })
        
        // Setup realtime subscription
        const channel = attendanceService.current.subscribeToAttendance((payload) => {
          console.log('📺 [TVSupabase] Received realtime attendance update:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRecord = payload.new as DisplayRecord
            
            // Update latest scan with animation
            setLatestScan(newRecord)
            setShowAnimation(true)
            setTimeout(() => setShowAnimation(false), 3000)
            
            // Play sound for new scan
            try {
              playSound(newRecord.action === 'check_in' ? 'check_in' : 'check_out')
            } catch (error) {
              console.error('Failed to play sound:', error)
            }
            
            // Update recent scans list
            setRecentScans(prev => {
              const updated = [newRecord, ...prev.slice(0, 9)]
              return updated
            })
            
            // Update stats
            setStats(prev => ({
              ...prev,
              totalToday: prev.totalToday + 1,
              checkIns: newRecord.action === 'check_in' ? prev.checkIns + 1 : prev.checkIns,
              checkOuts: newRecord.action === 'check_out' ? prev.checkOuts + 1 : prev.checkOuts,
              studentsPresent: newRecord.personType === 'student' && newRecord.action === 'check_in' 
                ? prev.studentsPresent + 1 
                : prev.studentsPresent,
              guardiansPresent: newRecord.personType === 'guardian' && newRecord.action === 'check_in'
                ? prev.guardiansPresent + 1
                : prev.guardiansPresent
            }))
          }
        })
        
        if (channel) {
          subscription = channel
          channelRef.current = subscription
          setIsConnected(true)
          setConnectionStatus('connected')
          console.log('✅ [TVSupabase] Realtime subscription active')
        }
        
      } catch (error) {
        console.error('❌ [TVSupabase] Failed to setup realtime:', error)
        setConnectionStatus('disconnected')
        setIsConnected(false)
      }
    }

    setupRealtimeAndLoadData()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  // Refresh data every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const stats = await attendanceService.current.getAttendanceStats()
        setStats(prev => ({
          ...prev,
          totalToday: stats.todayTotal,
          checkIns: stats.checkIns,
          checkOuts: stats.checkOuts
        }))
      } catch (error) {
        console.error('Failed to refresh stats:', error)
      }
    }, 30000)

    return () => clearInterval(refreshInterval)
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

  const getActionIcon = (action: string) => {
    return action === 'check_in' ? (
      <CheckCircle2 className="w-6 h-6 text-green-500" />
    ) : (
      <LogOut className="w-6 h-6 text-red-500" />
    )
  }

  const getPersonTypeIcon = (type: string) => {
    return type === 'student' ? (
      <GraduationCap className="w-5 h-5 text-blue-500" />
    ) : (
      <User className="w-5 h-5 text-purple-500" />
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 ${styles.tvContainer}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">School Gate Monitor</h1>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Offline</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-mono">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-gray-400">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
          <Button onClick={toggleFullscreen} className="bg-gray-700 hover:bg-gray-600">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Today</p>
                <p className="text-2xl font-bold">{stats.totalToday}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Students</p>
                <p className="text-2xl font-bold">{stats.studentsPresent}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Guardians</p>
                <p className="text-2xl font-bold">{stats.guardiansPresent}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Check-ins</p>
                <p className="text-2xl font-bold text-green-500">{stats.checkIns}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Check-outs</p>
                <p className="text-2xl font-bold text-red-500">{stats.checkOuts}</p>
              </div>
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Latest Scan */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Latest Scan</h2>
          {latestScan ? (
            <Card className={`bg-gray-800 border-gray-700 ${showAnimation ? styles.pulseAnimation : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {latestScan.profilePhotoUrl ? (
                    <img 
                      src={latestScan.profilePhotoUrl} 
                      alt={latestScan.personName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                      {getPersonTypeIcon(latestScan.personType)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getActionIcon(latestScan.action)}
                      <span className={`text-lg font-semibold ${
                        latestScan.action === 'check_in' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {latestScan.action === 'check_in' ? 'Checked In' : 'Checked Out'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{latestScan.personName}</h3>
                    <div className="flex items-center space-x-2 text-gray-400">
                      {getPersonTypeIcon(latestScan.personType)}
                      <span className="capitalize">{latestScan.personType}</span>
                      {latestScan.personId && (
                        <>
                          <span>•</span>
                          <span>ID: {latestScan.personId}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {format(new Date(latestScan.timestamp), 'h:mm:ss a')}
                      {latestScan.location && (
                        <span> • {latestScan.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <p className="text-gray-500 text-center">No scans yet today</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Scans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
                      {getActionIcon(scan.action)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getPersonTypeIcon(scan.personType)}
                          <span className="font-medium">{scan.personName}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(scan.timestamp), 'h:mm:ss a')}
                          {scan.location && <span> • {scan.location}</span>}
                        </div>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        scan.action === 'check_in' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {scan.action === 'check_in' ? 'IN' : 'OUT'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No activity yet today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}