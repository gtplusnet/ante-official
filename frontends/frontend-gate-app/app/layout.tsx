import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import './main.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'School Gatekeep',
  description: 'Comprehensive attendance management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}