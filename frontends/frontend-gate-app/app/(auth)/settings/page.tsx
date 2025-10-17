'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDistanceToNow } from 'date-fns'
import { getSyncAPIService } from '@/lib/services/sync-api.service'
import { getAuthHelperService } from '@/lib/services/auth-helper.service'
import { dbManager } from '@/lib/db/db-manager'

export default function SettingsPage() {
  // Note: Using API services for data access and license authentication
  const [syncInterval, setSyncInterval] = useState('5')
  const [schoolName, setSchoolName] = useState('Sample School')
  const [cameraPreference, setCameraPreference] = useState('environment')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isForcesyncing, setIsForceSyncing] = useState(false)
  const [licenseKey, setLicenseKey] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [licenseType, setLicenseType] = useState('')
  const [gateName, setGateName] = useState('')
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [isConnectingDevice, setIsConnectingDevice] = useState(false)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [guardianCount, setGuardianCount] = useState(0)
  const [lastDataRefresh, setLastDataRefresh] = useState(new Date())

  // Function to load database counts
  const loadDatabaseCounts = async () => {
    try {
      const [studentCnt, guardianCnt] = await Promise.all([
        dbManager.count('students'),
        dbManager.count('guardians')
      ])
      setStudentCount(studentCnt)
      setGuardianCount(guardianCnt)
      setAttendanceCount(0) // Attendance count set to 0 as the store no longer exists
      console.log(`Loaded counts: ${studentCnt} students, ${guardianCnt} guardians`)
    } catch (err) {
      console.error('Failed to get counts:', err)
      setStudentCount(0)
      setGuardianCount(0)
      setAttendanceCount(0)
    }
  }

  useEffect(() => {
    // Load saved settings
    const savedInterval = localStorage.getItem('syncInterval')
    if (savedInterval) setSyncInterval(savedInterval)
    
    const savedCameraPreference = localStorage.getItem('cameraPreference')
    if (savedCameraPreference) setCameraPreference(savedCameraPreference)
    
    const savedSoundEnabled = localStorage.getItem('soundEnabled')
    if (savedSoundEnabled !== null) setSoundEnabled(savedSoundEnabled === 'true')
    
    // Load license and company info
    const savedLicenseKey = localStorage.getItem('licenseKey')
    if (savedLicenseKey) {
      setLicenseKey(savedLicenseKey)

      // Refresh license info from backend
      const authService = getAuthHelperService()
      authService.validateLicense(savedLicenseKey).then(licenseInfo => {
        if (licenseInfo) {
          setCompanyId(licenseInfo.companyId?.toString() || '')
          setGateName(licenseInfo.gateName || '')
          setLicenseType('Gate License')  // API doesn't return this field

          // Update localStorage with latest info
          localStorage.setItem('companyId', licenseInfo.companyId?.toString() || '')
          localStorage.setItem('gateName', licenseInfo.gateName || '')
        }
      }).catch(err => {
        console.error('Failed to refresh license info:', err)
        // Fall back to saved values
        const savedCompanyId = localStorage.getItem('companyId')
        if (savedCompanyId) setCompanyId(savedCompanyId)

        const savedGateName = localStorage.getItem('gateName')
        if (savedGateName) setGateName(savedGateName)

        setLicenseType('Gate License')
      })
    }
    
    // Load database counts
    loadDatabaseCounts()

    // Refresh counts when page becomes visible (user navigates back to this page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible again, refreshing counts...')
        loadDatabaseCounts()
      }
    }

    // Also refresh when window gains focus (for in-app navigation)
    const handleFocus = () => {
      console.log('Window focused, refreshing counts...')
      loadDatabaseCounts()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    
    // Save settings to localStorage
    localStorage.setItem('syncInterval', syncInterval)
    localStorage.setItem('cameraPreference', cameraPreference)
    localStorage.setItem('soundEnabled', soundEnabled.toString())
    
    setTimeout(() => {
      setIsSaving(false)
    }, 500)
  }

  const handleForceSync = async () => {
    setIsForceSyncing(true)
    try {
      console.log('Starting force sync from settings...')
      const syncService = getSyncAPIService()
      await syncService.init()

      const result = await syncService.syncAll()

      // Save to IndexedDB (not just localStorage)
      console.log('Saving synced data to IndexedDB...')
      await dbManager.clearAllStores()
      
      // Save students to IndexedDB
      if (result.students.length > 0) {
        const studentsToSave = result.students.map(student => ({
          ...student,
          syncedAt: new Date()
        }))
        await dbManager.putAll('students', studentsToSave)
        console.log(`Saved ${studentsToSave.length} students to IndexedDB`)
      }
      
      // Save guardians to IndexedDB
      if (result.guardians.length > 0) {
        const guardiansToSave = result.guardians.map(guardian => ({
          ...guardian,
          syncedAt: new Date()
        }))
        await dbManager.putAll('guardians', guardiansToSave)
        console.log(`Saved ${guardiansToSave.length} guardians to IndexedDB`)
      }

      // Update counts
      setStudentCount(result.students.length)
      setGuardianCount(result.guardians.length)
      setLastDataRefresh(new Date())

      alert(`Sync completed successfully!\nStudents: ${result.students.length}\nGuardians: ${result.guardians.length}`)
    } catch (error) {
      console.error('Force sync failed:', error)
      alert('Sync failed. Please check console for details.')
    } finally {
      setIsForceSyncing(false)
    }
  }

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      try {
        await dbManager.clearAllStores()
        console.log('Local data cleared successfully')
        // Reload counts from database to reflect changes
        await loadDatabaseCounts()
        alert('Local data cleared successfully!')
      } catch (error) {
        console.error('Failed to clear data:', error)
        alert('Failed to clear data. Please check console for details.')
      }
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // Clear localStorage
      localStorage.removeItem('licenseKey')
      localStorage.removeItem('companyId')
      localStorage.removeItem('companyName')
      localStorage.removeItem('licenseType')
      localStorage.removeItem('gateName')
      
      // Clear cookie
      document.cookie = 'licenseKey=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      window.location.href = '/login'
    }
  }

  const handleConnectDevice = async () => {
    setIsConnectingDevice(true)
    try {
      const savedLicenseKey = localStorage.getItem('licenseKey')
      if (!savedLicenseKey) {
        alert('No license key found. Please login again.')
        window.location.href = '/login'
        return
      }

      // License validation serves as device connection
      const authService = getAuthHelperService()
      const licenseInfo = await authService.validateLicense(savedLicenseKey)

      if (licenseInfo) {
        alert('Device connected successfully! Gate: ' + licenseInfo.gateName)
        // Update local info
        setCompanyId(licenseInfo.companyId.toString())
        setGateName(licenseInfo.gateName)
      } else {
        alert('Failed to connect device. Invalid license key.')
      }
    } catch (error: any) {
      console.error('Device connection failed:', error)
      alert('Device connection failed: ' + error.message)
    } finally {
      setIsConnectingDevice(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                School Name
              </label>
              <Input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700">
                Sync Interval (minutes)
              </label>
              <Input
                id="syncInterval"
                type="number"
                min="1"
                max="60"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-gray-500">
                How often to sync data with the server
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner Settings</CardTitle>
            <CardDescription>Configure QR code scanner preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Camera Preference
              </label>
              <select
                value={cameraPreference}
                onChange={(e) => setCameraPreference(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="environment">Rear Camera (Default)</option>
                <option value="user">Front Camera</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scan Sound</p>
                <p className="text-sm text-gray-500">Play sound on successful scan</p>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage local data and sync status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {/* Sync Status */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 font-medium">Sync Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Students Synced</span>
                  <span className="text-sm">{studentCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Guardians Synced</span>
                  <span className="text-sm">{guardianCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Data Refresh</span>
                  <span className="text-sm">
                    {formatDistanceToNow(lastDataRefresh, { addSuffix: true })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Data Source</span>
                  <span className="text-sm font-medium text-green-600">
                    API + WebSocket
                  </span>
                </div>
              </div>
            </div>

            {/* Local Storage Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 font-medium">Local Storage</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Profiles</span>
                  <span className="text-sm">
                    {(studentCount + guardianCount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Attendance Logs</span>
                  <span className="text-sm">{attendanceCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Database Status</span>
                  <span className="text-sm text-green-600">
                    Ready (IndexedDB)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleForceSync}
                disabled={isForcesyncing}
              >
                {isForcesyncing ? 'Syncing...' : 'Force Sync'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearData} 
                className="text-red-600 hover:bg-red-50"
              >
                Clear Local Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your license and account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="rounded-lg bg-gray-50 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">License Key</p>
                <p className="font-mono text-sm text-gray-600">
                  {licenseKey ? (
                    <>
                      {licenseKey.substring(0, 4)}****-****-{licenseKey.substring(licenseKey.length - 4)}
                    </>
                  ) : (
                    'Not available'
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">License Type</p>
                <p className="text-sm text-gray-600">
                  {licenseType || 'Not available'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Company</p>
                <p className="text-sm text-gray-600">
                  {companyName && companyName !== 'null' ? (
                    <>
                      {companyName} <span className="text-gray-400">(ID: {companyId})</span>
                    </>
                  ) : (
                    companyId ? `Company ID: ${companyId}` : 'Not available'
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Gate</p>
                <p className="text-sm text-gray-600">
                  {gateName || 'Not assigned'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Authentication Status</p>
                <p className="text-sm text-green-600">
                  Licensed (Authentication Only)
                </p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  License key: {licenseKey || 'Not available'}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}