'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Keyboard, Camera } from 'lucide-react'

interface ScannerProps {
  onScan: (data: string) => void
  isActive: boolean
  useFrontCamera?: boolean
  manualInputMode?: boolean
  onToggleMode?: () => void
}

export interface ScannerHandle {
  stopScanner: () => Promise<void>
}

export const Scanner = forwardRef<ScannerHandle, ScannerProps>(({ onScan, isActive, useFrontCamera = false, manualInputMode = false, onToggleMode }, ref) => {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const isCleaningUp = useRef(false)
  const onScanRef = useRef(onScan)
  const [manualInput, setManualInput] = useState('')
  const [inputError, setInputError] = useState('')
  const [cameraError, setCameraError] = useState<string>('')
  
  // Debug logging - commented out to reduce console noise
  // useEffect(() => {
  //   console.log('Scanner component state:', {
  //     isActive,
  //     manualInputMode,
  //     hasToggleMode: !!onToggleMode,
  //     hasPermission
  //   })
  // }, [isActive, manualInputMode, onToggleMode, hasPermission])
  
  
  // Update ref when onScan changes
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  // Handle manual input submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInputError('')
    
    if (!manualInput.trim()) {
      setInputError('Please enter a QR code value')
      return
    }
    
    // Validate format: should be "student:{uuid}" or "guardian:{uuid}"
    const pattern = /^(student|guardian):[a-f0-9-]+$/i
    if (!pattern.test(manualInput.trim())) {
      setInputError('Invalid format. Expected: student:id or guardian:id')
      return
    }
    
    console.log('Manual scan input:', manualInput)
    onScanRef.current(manualInput.trim())
    setManualInput('')
  }

  // Handle Enter key in input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualSubmit(e as any)
    }
  }

  // Expose stop method to parent
  const stopScanner = async () => {
    console.log('Stopping scanner via imperative handle')
    
    if (isCleaningUp.current) {
      console.log('Already cleaning up, skipping')
      return
    }
    
    isCleaningUp.current = true
    setIsScanning(false)
    
    if (html5QrCodeRef.current) {
      const scanner = html5QrCodeRef.current
      html5QrCodeRef.current = null
      
      try {
        const state = scanner.getState()
        console.log('Scanner state before stop:', state)
        
        if (state === 2) { // SCANNING state
          await scanner.stop()
          console.log('Scanner stopped successfully')
        } else {
          console.log('Scanner not in scanning state, skipping stop')
        }
      } catch (err: any) {
        if (!err?.message?.includes('not running')) {
          console.error('Error stopping scanner:', err)
        }
      }
    }
    
    isCleaningUp.current = false
  }

  useImperativeHandle(ref, () => ({
    stopScanner
  }), [])

  // Handle uncaught scanner errors globally
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Cannot stop')) {
        event.preventDefault()
        console.debug('Suppressed scanner stop error')
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])


  useEffect(() => {
    if (!isActive || manualInputMode) return

    let mounted = true
    
    const startScanner = async () => {
      try {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if component is still mounted
        if (!mounted || !scannerRef.current) return
        
        // Don't start if already scanning
        if (html5QrCodeRef.current) return
        
        console.log('Initializing QR scanner...')
        const html5QrCode = new Html5Qrcode("qr-reader")
        html5QrCodeRef.current = html5QrCode

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }

        try {
          // Try to get available cameras first
          const devices = await Html5Qrcode.getCameras()
          console.log('Available cameras:', devices)
          
          if (devices && devices.length === 0) {
            console.error('No cameras found on device')
            if (mounted) {
              setHasPermission(false)
              setCameraError('No cameras found on this device')
            }
            return
          }

          // Try specific camera mode first
          const cameraConstraint = useFrontCamera 
            ? { facingMode: "user" }
            : { facingMode: "environment" }
          
          console.log('Starting QR scanner with config:', config, 'camera:', useFrontCamera ? 'front' : 'rear')
          
          try {
            await html5QrCode.start(
              cameraConstraint,
              config,
              (decodedText) => {
                console.log('Scanner detected QR code:', decodedText)
                if (mounted) {
                  onScanRef.current(decodedText)
                }
              },
              (errorMessage) => {
                // Ignore - this fires constantly when no QR code is in view
              }
            )
            
            if (mounted) {
              console.log('QR scanner started successfully')
              setHasPermission(true)
              setIsScanning(true)
            }
          } catch (cameraError: any) {
            // If specific camera mode fails, try with device ID fallback
            console.warn('Failed with camera constraint, trying device ID fallback:', cameraError.message)
            
            if (devices && devices.length > 0) {
              // Try the first available camera
              const deviceId = devices[0].id
              console.log('Attempting fallback with device ID:', deviceId)
              
              await html5QrCode.start(
                deviceId,
                config,
                (decodedText) => {
                  console.log('Scanner detected QR code:', decodedText)
                  if (mounted) {
                    onScanRef.current(decodedText)
                  }
                },
                (errorMessage) => {
                  // Ignore - this fires constantly when no QR code is in view
                }
              )
              
              if (mounted) {
                console.log('QR scanner started successfully with fallback camera')
                setHasPermission(true)
                setIsScanning(true)
              }
            } else {
              throw cameraError
            }
          }
        } catch (err: any) {
          console.error("Camera enumeration or start failed:", err)
          
          // Check if it's a NotFoundError or similar
          if (err.message?.includes('NotFoundError') || err.message?.includes('not found')) {
            console.error('Camera device not found - device may not have a camera')
            if (mounted) {
              setCameraError('Camera device not found')
            }
          } else if (err.message?.includes('NotAllowedError') || err.message?.includes('Permission')) {
            console.error('Camera permission denied by user')
            if (mounted) {
              setCameraError('Camera permission was denied')
            }
          } else {
            if (mounted) {
              setCameraError(err.message || 'Failed to access camera')
            }
          }
          
          if (mounted) {
            setHasPermission(false)
          }
        }
      } catch (err: any) {
        console.error("Failed to initialize scanner:", err)
        if (mounted) {
          setHasPermission(false)
          setCameraError(err.message || 'Failed to initialize scanner')
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      // Use the centralized stopScanner method
      stopScanner().catch(err => {
        console.debug('Cleanup error:', err)
      })
    }
  }, [isActive, useFrontCamera, manualInputMode])

  // Check manual mode first - it doesn't need camera permissions or active state
  if (manualInputMode) {
    console.log('Rendering manual input mode')
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-50">
        {/* Mode toggle button */}
        {onToggleMode && (
          <button
            onClick={onToggleMode}
            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Switch to Camera</span>
          </button>
        )}
        
        {/* Manual input form */}
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-6">
            <Keyboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Manual Input Mode</h3>
            <p className="text-sm text-gray-600 mt-2">
              Enter QR code value in format: student:id or guardian:id
            </p>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., student:550e8400-e29b-41d4-a716"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
              {inputError && (
                <p className="mt-2 text-sm text-red-600">{inputError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Submit Scan
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Tip: You can also press Enter to submit
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if not active (camera mode requires active state)
  if (!isActive) {
    console.log('Scanner not active, showing inactive message')
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Camera not active</p>
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Keyboard className="w-4 h-4" />
              <span>Use Manual Input</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Check camera permissions
  if (hasPermission === false) {
    console.log('No camera permission or device not available:', cameraError)
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="mb-4">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 font-semibold mb-2">Camera Not Available</p>
            {cameraError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg">
                {cameraError}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-4">
              This could be because:
            </p>
            <ul className="text-sm text-gray-500 text-left max-w-xs mx-auto space-y-1">
              <li>• No camera is available on this device</li>
              <li>• Camera permission was denied</li>
              <li>• The camera is being used by another app</li>
            </ul>
          </div>
          {onToggleMode ? (
            <button
              onClick={onToggleMode}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Keyboard className="w-5 h-5" />
              <span>Use Manual Input Instead</span>
            </button>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              Please check your camera settings and reload the page
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show camera scanner mode
  return (
    <div className={`relative h-full w-full qr-scanner-container ${useFrontCamera ? 'front-camera' : ''}`}>
      <div id="qr-reader" ref={scannerRef} className="h-full w-full"></div>
      
      {/* Mode toggle button */}
      {onToggleMode && (
        <button
          onClick={onToggleMode}
          className="absolute top-4 left-4 bg-blue-600/70 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Keyboard className="w-4 h-4" />
          <span>Manual Input</span>
        </button>
      )}
      
      {/* Camera type indicator */}
      <div className="absolute top-4 right-4 bg-black/30 text-white px-3 py-2 rounded-lg text-sm camera-type-indicator">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4h-6a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span>{useFrontCamera ? 'Front' : 'Rear'}</span>
        </div>
      </div>
    </div>
  )
})

Scanner.displayName = 'Scanner'