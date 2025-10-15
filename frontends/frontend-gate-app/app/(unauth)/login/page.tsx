'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getAuthHelperService } from '@/lib/services/auth-helper.service'

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
      console.log('[Login] Validating license key with backend...')

      const authService = getAuthHelperService()
      const licenseInfo = await authService.validateLicense(licenseKey)

      if (!licenseInfo) {
        setError('Invalid license key. Please check and try again.')
        setIsLoading(false)
        return
      }

      // License validation successful - save to localStorage
      console.log('[Login] License validation successful:', licenseInfo)

      localStorage.setItem('licenseKey', licenseKey)
      localStorage.setItem('companyId', licenseInfo.companyId?.toString() || '')
      localStorage.setItem('gateName', licenseInfo.gateName || '')
      localStorage.setItem('licenseType', 'Gate License')

      // Set cookie for middleware
      document.cookie = `licenseKey=${licenseKey}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days

      console.log('[Login] Gate App authenticated successfully')
      console.log('[Login] Company ID:', licenseInfo.companyId)
      console.log('[Login] Gate Name:', licenseInfo.gateName)

      // Redirect to scan page
      router.push('/scan')

    } catch (err: any) {
      console.error('[Login] License validation error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className={`transition-opacity duration-200 ${isLoading ? 'opacity-75' : 'opacity-100'}`}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">School Gatekeep</CardTitle>
          <CardDescription className="text-center">
            Enter your license key to activate the application
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6 pb-6">
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
              isLoading={isLoading}
              disabled={!licenseKey}
            >
              {isLoading ? 'Validating license...' : 'Activate'}
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
