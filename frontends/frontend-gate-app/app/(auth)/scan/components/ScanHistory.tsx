interface ScanRecord {
  id: number
  name: string
  type: 'Student' | 'Teacher' | 'Guardian'
  time: string
  action: 'Check In' | 'Check Out'
  synced: boolean
}

interface ScanHistoryProps {
  scans: ScanRecord[]
}

export function ScanHistory({ scans }: ScanHistoryProps) {
  const getTypeColor = (type: ScanRecord['type']) => {
    switch (type) {
      case 'Student':
        return 'bg-blue-100 text-blue-800'
      case 'Teacher':
        return 'bg-purple-100 text-purple-800'
      case 'Guardian':
        return 'bg-green-100 text-green-800'
    }
  }

  const getActionColor = (action: ScanRecord['action']) => {
    return action === 'Check In' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {scans.length === 0 ? (
        <p className="text-center text-gray-500">No scans recorded yet</p>
      ) : (
        scans.map((scan) => (
          <div
            key={scan.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold">
                {scan.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{scan.name}</p>
                <div className="flex items-center space-x-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(scan.type)}`}>
                    {scan.type}
                  </span>
                  {!scan.synced && (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Pending Sync
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{scan.time}</p>
              <p className={`text-sm font-semibold ${getActionColor(scan.action)}`}>
                {scan.action}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}