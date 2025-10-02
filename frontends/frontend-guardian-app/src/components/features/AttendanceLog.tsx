import React from 'react';
import { format } from 'date-fns';

interface AttendanceLogItemProps {
  log: {
    id: string;
    studentId: string;
    studentName: string;
    timestamp: Date;
    type: 'entry' | 'exit';
    date?: string;
  };
}

export const AttendanceLogItem: React.FC<AttendanceLogItemProps> = ({ log }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] active:shadow-sm">
      <div className="flex items-start gap-3">
        {/* Student Photo */}
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600 text-sm font-medium">
            SN
          </span>
        </div>

        {/* Log Details */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{log.studentName}</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {log.type === 'entry' ? 'Entered the school' : 'Left the school'}
          </p>
        </div>

        {/* Time */}
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {format(log.timestamp, 'hh:mm a').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};

interface AttendanceLogGroupProps {
  date: Date;
  logs: AttendanceLogItemProps['log'][];
}

export const AttendanceLogGroup: React.FC<AttendanceLogGroupProps> = ({ date, logs }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-600 mb-3">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </h3>
      <div className="space-y-3">
        {logs.map((log) => (
          <AttendanceLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
};