'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SyncService } from '@/lib/services/sync.service'

export default function LoginPage() {
  const router = useRouter()
  const [licenseKey, setLicenseKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // First, try to validate with backend if available
      const syncService = new SyncService()
      let validationResult = null
      
      try {
        validationResult = await syncService.validateLicense(licenseKey)
      } catch (backendError) {
        console.log('[Login] Backend not available, will use direct Supabase auth')
      }
      
      if (validationResult && validationResult.valid) {
        // Backend validation successful
        localStorage.setItem('licenseKey', licenseKey)
        localStorage.setItem('companyId', validationResult.companyId?.toString() || '')
        localStorage.setItem('companyName', validationResult.companyName || '')
        localStorage.setItem('licenseType', validationResult.licenseType || '')
        localStorage.setItem('gateName', validationResult.gateName || '')
        
        // Initialize Supabase session if tokens are provided
        if (validationResult.supabaseToken && validationResult.supabaseRefreshToken) {
          const { getSupabaseService } = await import('@/lib/services/supabase.service')
          const supabaseService = getSupabaseService()
          
          await supabaseService.setSession(
            validationResult.supabaseToken,
            validationResult.supabaseRefreshToken
          )
          
          console.log('Supabase session initialized from backend tokens')
        } else {
          // Backend didn't provide tokens, authenticate using service account
          console.log('[Login] Backend did not provide tokens, using service account authentication')
          const { getAuthHelperService } = await import('@/lib/services/auth-helper.service')
          const authHelper = getAuthHelperService()
          
          const tokens = await authHelper.authenticateGateApp(validationResult.companyId || 16)
          
          if (tokens) {
            const { getSupabaseService } = await import('@/lib/services/supabase.service')
            const supabaseService = getSupabaseService()
            
            await supabaseService.setSession(
              tokens.supabaseToken,
              tokens.supabaseRefreshToken
            )
            
            console.log('Supabase session initialized using service account')
          } else {
            console.error('Failed to get Supabase tokens from service account')
            setError('Authentication failed. Please contact support.')
            return
          }
        }
        
        // Also set as cookie for middleware
        document.cookie = `licenseKey=${licenseKey}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
        
        console.log('Gate App authenticated successfully')
        router.push('/dashboard')
      } else {
        // Backend validation failed or unavailable, try direct Supabase auth
        console.log('[Login] Attempting direct Supabase authentication...')
        
        // For demo/testing: Accept specific license keys without backend
        const validLicenses = ['GATE-2025-DEMO', 'GATE-TEST-001', 'gate-license-001']
        
        if (validLicenses.includes(licenseKey)) {
          // Store basic info
          localStorage.setItem('licenseKey', licenseKey)
          localStorage.setItem('companyId', '16') // Default company ID
          localStorage.setItem('companyName', 'Demo Company')
          localStorage.setItem('licenseType', 'gate')
          localStorage.setItem('gateName', 'Main Gate')
          
          // Authenticate directly with Supabase
          const { getAuthSupabaseService } = await import('@/lib/services/auth-supabase.service')
          const authService = getAuthSupabaseService()
          
          const authResult = await authService.authenticateGateApp(licenseKey, 16)
          
          if (authResult.success) {
            // Set cookie for middleware
            document.cookie = `licenseKey=${licenseKey}; path=/; max-age=${60 * 60 * 24 * 30}`
            
            console.log('Gate App authenticated with Supabase directly')
            router.push('/dashboard')
          } else {
            setError('Failed to authenticate. Please try again.')
          }
        } else {
          setError('Invalid or inactive license key. Backend is not available.')
        }
      }
    } catch (err: any) {
      console.error('License validation error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">School Gatekeep</CardTitle>
          <CardDescription className="text-center">
            Enter your license key to activate the application
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="license" className="text-sm font-medium text-gray-700">
                License Key
              </label>
              <Input
                id="license"
                type="text"
                placeholder="Enter your license key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                disabled={isLoading}
                required
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !licenseKey}
            >
              {isLoading ? 'Validating...' : 'Activate'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-gray-600">
        Contact your administrator if you don't have a license key
      </p>
    </div>
  )
}