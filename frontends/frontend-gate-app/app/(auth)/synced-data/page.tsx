'use client'

import { db } from '@/lib/db'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { Search, RefreshCw, Users, UserCheck } from 'lucide-react'

interface Student {
  id: string
  qrCode: string
  studentNumber: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  gender: string
  isActive: boolean
  syncedAt: Date
  profilePhotoUrl?: string
}

interface Guardian {
  id: string
  qrCode: string
  firstName: string
  lastName: string
  email?: string
  contactNumber?: string
  isActive: boolean
  syncedAt: Date
  studentCount: number
  profilePhotoUrl?: string
}

export default function SyncedDataPage() {
  // Note: Displays data synced from API and cached in IndexedDB
  const [activeTab, setActiveTab] = useState<'students' | 'guardians'>('students')
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize DB first
        await db.init();
        // Load data from IndexedDB (synced from API)
        await loadData();
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };
    
    init();
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Ensure database is initialized
      await db.init();
      
      // Load students
      const allStudents = await db.getAll<Student>('students');
      console.log('Loaded students:', allStudents.length);
      console.log('First student:', allStudents[0]);
      setStudents(allStudents.map((s: any) => ({
        ...s,
        syncedAt: new Date(s.syncedAt || s.updatedAt || s.createdAt || Date.now())
      })))
      
      // Load guardians
      const allGuardians = await db.getAll<Guardian>('guardians');
      console.log('Loaded guardians:', allGuardians.length);
      console.log('First guardian:', allGuardians[0]);
      setGuardians(allGuardians.map((g: any) => ({
        ...g,
        syncedAt: new Date(g.syncedAt || g.updatedAt || g.createdAt || Date.now()),
        studentCount: g.students?.length || 0
      })))
    } catch (error) {
      console.error('Failed to load data:', error)
      setStudents([])
      setGuardians([])
    } finally {
      setIsLoading(false)
    }
  }


  const handleRefresh = async () => {
    setIsSyncing(true)
    try {
      await loadData()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.middleName?.toLowerCase().includes(searchLower) ||
      student.studentNumber?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.qrCode?.toLowerCase().includes(searchLower)
    )
  })

  const filteredGuardians = guardians.filter(guardian => {
    const searchLower = searchTerm.toLowerCase()
    return (
      guardian.firstName?.toLowerCase().includes(searchLower) ||
      guardian.lastName?.toLowerCase().includes(searchLower) ||
      guardian.contactNumber?.toLowerCase().includes(searchLower) ||
      guardian.email?.toLowerCase().includes(searchLower) ||
      guardian.qrCode?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Synced Data</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={isSyncing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last refreshed: {format(lastRefresh, 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guardians</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardians.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last refreshed: {format(lastRefresh, 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex space-x-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Students ({filteredStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('guardians')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'guardians'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Guardians ({filteredGuardians.length})
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : activeTab === 'students' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Student Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Synced At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${student.firstName} ${student.lastName}`)}&background=3b82f6&color=ffffff&size=128&font-size=0.5&rounded=true`} 
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-10 h-10 object-cover rounded-full"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {student.lastName || ''}, {student.firstName || ''} {student.middleName || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.studentNumber || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">
                          {student.qrCode || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(student.syncedAt, 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Guardian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Synced At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredGuardians.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No guardians found
                      </td>
                    </tr>
                  ) : (
                    filteredGuardians.map((guardian) => (
                      <tr key={guardian.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${guardian.firstName} ${guardian.lastName}`)}&background=10b981&color=ffffff&size=128&font-size=0.5&rounded=true`} 
                              alt={`${guardian.firstName} ${guardian.lastName}`}
                              className="w-10 h-10 object-cover rounded-full"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {guardian.lastName || ''}, {guardian.firstName || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {guardian.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {guardian.contactNumber || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${guardian.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {guardian.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">
                          {guardian.qrCode || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(guardian.syncedAt, 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}