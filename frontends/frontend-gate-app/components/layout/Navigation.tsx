'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    title: 'Scan Module',
    href: '/scan',
    icon: '📱',
    description: 'Scan QR codes for attendance'
  },
  {
    title: 'TV Display',
    href: '/tv',
    icon: '📺',
    description: 'Display attendance on large screen'
  }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-4 md:grid-cols-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative rounded-lg border p-6 transition-all hover:shadow-lg ${
              isActive
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className={`font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}