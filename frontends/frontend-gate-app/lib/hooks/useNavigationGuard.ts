'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type CleanupFunction = () => void | Promise<void>

export function useNavigationGuard(cleanup: CleanupFunction) {
  const router = useRouter()
  const cleanupRef = useRef(cleanup)
  
  // Update cleanup ref when cleanup function changes
  useEffect(() => {
    cleanupRef.current = cleanup
  }, [cleanup])

  useEffect(() => {
    // Store original push method
    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back
    const originalForward = router.forward
    
    // Create wrapper that runs cleanup before navigation
    const wrapNavigation = (originalMethod: Function) => {
      return async (...args: any[]) => {
        console.log('Navigation guard: Running cleanup before navigation')
        try {
          // Run cleanup
          await cleanupRef.current()
          // Small delay to ensure cleanup completes
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error('Navigation guard cleanup error:', error)
        }
        // Proceed with navigation
        return originalMethod.apply(router, args)
      }
    }
    
    // Override navigation methods
    router.push = wrapNavigation(originalPush) as typeof router.push
    router.replace = wrapNavigation(originalReplace) as typeof router.replace
    router.back = wrapNavigation(originalBack) as typeof router.back
    router.forward = wrapNavigation(originalForward) as typeof router.forward
    
    // Cleanup: restore original methods
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
      router.forward = originalForward
    }
  }, [router])
  
  // Also handle browser back/forward buttons
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      try {
        await cleanupRef.current()
      } catch (error) {
        console.error('Cleanup error on unload:', error)
      }
    }
    
    const handlePopState = async () => {
      console.log('Browser navigation detected, running cleanup')
      try {
        await cleanupRef.current()
      } catch (error) {
        console.error('Cleanup error on popstate:', error)
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
}