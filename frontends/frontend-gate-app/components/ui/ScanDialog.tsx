'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, User, Clock, X } from 'lucide-react'

interface ScanDialogProps {
  isOpen: boolean
  onClose: () => void
  data: {
    personName: string
    personType: 'student' | 'guardian'
    action: 'check_in' | 'check_out' | 'in' | 'out'
    timestamp: Date
    profilePhotoUrl?: string
    status: 'success' | 'error' | 'processing'
    message?: string
  } | null
  autoCloseDuration?: number // in milliseconds, default 3000
}

export default function ScanDialog({ 
  isOpen, 
  onClose, 
  data, 
  autoCloseDuration = 3000 
}: ScanDialogProps) {
  const [progress, setProgress] = useState(100)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!isOpen || !data) {
      setProgress(100)
      setIsClosing(false)
      return
    }

    // Start countdown
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) {
        handleClose()
      }
    }, 50)

    // Auto close after duration
    const timeout = setTimeout(() => {
      handleClose()
    }, autoCloseDuration)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isOpen, data, autoCloseDuration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200) // Match animation duration
  }

  if (!isOpen || !data) return null

  const isCheckIn = data.action === 'check_in' || data.action === 'in'
  const actionText = isCheckIn ? 'Checked In' : 'Checked Out'
  const actionColor = isCheckIn ? 'text-green-600' : 'text-blue-600'
  const actionBgColor = isCheckIn ? 'bg-green-50' : 'bg-blue-50'

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="p-8 text-center">
          {/* Profile Photo or Icon */}
          <div className="mb-6 flex justify-center">
            {data.profilePhotoUrl ? (
              <img
                src={data.profilePhotoUrl}
                alt={data.personName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Status Icon and Message */}
          <div className="mb-4">
            {data.status === 'processing' ? (
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
                <span className="text-lg font-medium">Processing...</span>
              </div>
            ) : data.status === 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-lg font-medium text-gray-800">Successfully Scanned</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="text-lg font-medium text-gray-800">Scan Error</span>
              </div>
            )}
          </div>

          {/* Person Name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {data.personName}
          </h3>

          {/* Person Type Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {data.personType === 'student' ? 'Student' : 'Guardian'}
            </span>
          </div>

          {/* Action and Time */}
          {data.status === 'success' && (
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${actionBgColor} mb-6`}>
              <Clock className={`h-5 w-5 ${actionColor}`} />
              <span className={`font-semibold ${actionColor}`}>
                {actionText} at {data.timestamp.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          )}

          {/* Error Message */}
          {data.status === 'error' && data.message && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-6">
              {data.message}
            </div>
          )}

          {/* Progress Bar */}
          <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}