'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAttendanceSupabaseService } from '@/lib/services/attendance-supabase.service'
import type { AttendanceRecord } from '@/lib/services/attendance-supabase.service'
import { format } from 'date-fns'
import { Clock, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CheckedInPage() {
  const [checkedIn, setCheckedIn] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const attendanceSupabaseService = getAttendanceSupabaseService()

  useEffect(() => {
    loadCheckedIn()
    
    // Refresh every 10 seconds
    const interval = setInterval(loadCheckedIn, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadCheckedIn = async () => {
    try {
      await attendanceSupabaseService.init()
      const records = await attendanceSupabaseService.getCurrentlyCheckedIn()
      setCheckedIn(records)
    } catch (error) {
      console.error('Failed to load checked-in students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Currently Checked In</h1>
        <Link 
          href="/scan" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scanner
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students & Guardians Currently Inside</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{checkedIn.length} {checkedIn.length === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading...
            </div>
          ) : checkedIn.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No one is currently checked in</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkedIn.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      <img 
                        src={record.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.personName)}&background=${record.personType === 'student' ? '3b82f6' : '10b981'}&color=ffffff&size=128&font-size=0.5&rounded=true`} 
                        alt={record.personName}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    </div>
                    
                    {/* Person Info */}
                    <div>
                      <p className="font-semibold">{record.personName}</p>
                      <p className="text-sm text-gray-600">
                        {record.personType === 'student' ? 'Student' : 'Guardian'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.qrCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Checked In</p>
                    <p className="text-sm text-gray-600" suppressHydrationWarning>
                      {format(new Date(record.timestamp), 'HH:mm:ss')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const mins = Math.floor((Date.now() - new Date(record.timestamp).getTime()) / 60000)
                        if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
                        const hours = Math.floor(mins / 60)
                        return `${hours} hour${hours !== 1 ? 's' : ''} ago`
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This list shows all people who have checked in today but haven't checked out yet. 
              The list refreshes automatically every 10 seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}