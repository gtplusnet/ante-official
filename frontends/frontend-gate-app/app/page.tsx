'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    const licenseKey = localStorage.getItem('licenseKey')
    if (licenseKey) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])
  
  return null
}