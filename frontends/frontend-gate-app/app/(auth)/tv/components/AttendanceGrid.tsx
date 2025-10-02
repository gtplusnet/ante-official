'use client'

interface AttendanceRecord {
  id: number
  name: string
  type: 'Student' | 'Teacher' | 'Guardian'
  time: string
  action: 'Check In' | 'Check Out'
  photo?: string | null
}

interface AttendanceGridProps {
  records: AttendanceRecord[]
  columns?: number
}

export function AttendanceGrid({ records, columns = 3 }: AttendanceGridProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getTypeGradient = (type: AttendanceRecord['type']) => {
    switch (type) {
      case 'Student':
        return 'from-blue-400 to-blue-600'
      case 'Teacher':
        return 'from-purple-400 to-purple-600'
      case 'Guardian':
        return 'from-green-400 to-green-600'
    }
  }

  return (
    <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {records.map((record) => (
        <div
          key={record.id}
          className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-gradient-to-br from-gray-900 to-gray-600"></div>
          </div>
          
          <div className="relative flex items-center space-x-4">
            {/* Avatar */}
            <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${getTypeGradient(record.type)} text-2xl font-bold text-white shadow-lg`}>
              {getInitials(record.name)}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{record.name}</h3>
              <p className="text-sm text-gray-600">{record.type}</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className={`text-xl ${record.action === 'Check In' ? 'text-green-500' : 'text-red-500'}`}>
                  {record.action === 'Check In' ? '↓' : '↑'}
                </span>
                <span className="text-sm font-medium text-gray-700">{record.time}</span>
              </div>
            </div>
          </div>
          
          {/* Action Badge */}
          <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
            record.action === 'Check In' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {record.action}
          </div>
        </div>
      ))}
    </div>
  )
}