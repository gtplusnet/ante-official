import { Navigation } from '@/components/layout/Navigation'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Welcome to School Gatekeep</h1>
        <p className="mt-2 text-lg text-gray-600">
          Select a module to get started
        </p>
      </div>

      <Navigation />

      <div className="mt-12 rounded-lg bg-blue-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-blue-900">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Use the Scan Module to check students in and out with QR codes</li>
          <li>• The TV Display shows real-time attendance on large screens</li>
          <li>• All scans are saved locally and sync automatically when online</li>
          <li>• Visit Settings to configure sync intervals and preferences</li>
        </ul>
      </div>
    </div>
  )
}