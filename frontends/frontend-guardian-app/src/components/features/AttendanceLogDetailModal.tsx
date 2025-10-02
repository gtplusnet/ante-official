import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  FiClock, 
  FiMapPin, 
  FiUser,
  FiCalendar,
  FiActivity
} from 'react-icons/fi';
import { format } from 'date-fns';

interface AttendanceLogDetail {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  timestamp: Date;
  type: 'entry' | 'exit';
  location: string;
  gate?: string;
  guardianNotified?: boolean;
  notificationTime?: Date;
}

interface AttendanceLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
}

// Mock data - in real app, this would fetch from API
const mockLogDetail: AttendanceLogDetail = {
  id: '1',
  studentId: '1',
  studentName: 'Juan Miguel Dela Cruz',
  timestamp: new Date('2025-07-01T08:05:00'),
  type: 'entry',
  location: 'Main Gate',
  gate: 'Gate A',
  guardianNotified: true,
  notificationTime: new Date('2025-07-01T08:05:30'),
};

export const AttendanceLogDetailModal: React.FC<AttendanceLogDetailModalProps> = ({
  isOpen,
  onClose,
  logId,
}) => {
  // In real app, fetch log details based on logId
  const log = mockLogDetail;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Log Details"
      size="md"
    >
      <div className="space-y-6">
        {/* Header with Student Info */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-semibold text-gray-600">
              {log.studentName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{log.studentName}</h3>
            <div className="mt-1">
              <Badge variant={log.type === 'entry' ? 'success' : 'warning'}>
                {log.type === 'entry' ? 'Entered School' : 'Left School'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Time and Date */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 text-blue-900">
            <FiClock className="w-5 h-5" />
            <div>
              <p className="font-semibold">
                {format(log.timestamp, 'h:mm:ss a')}
              </p>
              <p className="text-sm text-blue-700">
                {format(log.timestamp, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-primary-500" />
            Location Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Entry/Exit Point</span>
              <span className="font-medium">{log.location}</span>
            </div>
            {log.gate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Gate</span>
                <span className="font-medium">{log.gate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-primary-500" />
            Additional Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Guardian Notified</span>
              <span className="font-medium">
                {log.guardianNotified ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </span>
            </div>
            {log.guardianNotified && log.notificationTime && (
              <div className="flex justify-between">
                <span className="text-gray-500">Notification Sent</span>
                <span className="font-medium">
                  {format(log.notificationTime, 'h:mm:ss a')}
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};