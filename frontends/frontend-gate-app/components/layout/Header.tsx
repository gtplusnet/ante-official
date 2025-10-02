'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const pathname = usePathname()
  const isAuthenticated = pathname !== '/login'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">School Gatekeep</span>
        </Link>
        
        {isAuthenticated && (
          <nav className="ml-auto flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/scan"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/scan' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Scan
            </Link>
            <Link
              href="/tv"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/tv' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              TV Display
            </Link>
            <Link
              href="/synced-data"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/synced-data' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Synced Data
            </Link>
            <Link
              href="/settings"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/settings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Settings
            </Link>
            <Link
              href="/test-qr"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/test-qr' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Test QR
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}