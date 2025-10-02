'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StudentDetailModal } from '@/components/features/StudentDetailModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiUser, 
  FiChevronRight, 
  FiBook,
  FiClock,
  FiAlertCircle 
} from 'react-icons/fi';
import { format } from 'date-fns';

interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  relationship: string;
  isPrimary: boolean;
  // Additional fields that we'll add later
  gradeLevel?: string;
  section?: string;
  status?: 'active' | 'inactive';
  photoUrl?: string;
  lastAttendance?: {
    date: Date;
    type: 'entry' | 'exit';
  };
  currentStatus?: string;
  attendanceRate?: number;
}

export default function StudentsPage() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const router = useRouter();
  const { user, loading, refreshAuth } = useAuth();
  
  const students: Student[] = user?.students || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refreshAuth();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In School':
        return 'text-green-600 bg-green-50';
      case 'Not in School':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentDetail(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Student Information" 
        onMenuClick={() => setIsNavOpen(true)}
      />
      
      <Navigation 
        isOpen={isNavOpen} 
        onClose={() => setIsNavOpen(false)}
        guardian={{
          id: user?.id || '',
          name: user ? `${user.firstName} ${user.lastName}` : '',
          email: user?.email || '',
          photoUrl: undefined
        }}
      />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="px-4 py-4">
          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              My Students ({students.length})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tap on a student to view detailed information
            </p>
          </div>

          {/* Students List */}
          {students.length === 0 ? (
          <Card className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Students Connected</h3>
              <p className="text-sm text-gray-600 mb-4">
                You haven't connected any students to your account yet.
              </p>
              <button
                onClick={() => router.push('/add-student')}
                className="text-primary-600 font-medium text-sm hover:underline"
              >
                Add your first student
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
            <Card 
              key={student.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
              onClick={() => handleStudentClick(student.id)}
            >
              <div className="flex items-start gap-4">
                {/* Student Photo/Initials */}
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-semibold text-gray-600">
                    {getInitials(student.firstName, student.lastName)}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Student No: {student.studentNumber}
                      </p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                  </div>

                  {/* Relationship */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">
                      Relationship: <span className="font-medium">{student.relationship}</span>
                    </span>
                    {student.isPrimary && (
                      <Badge variant="info" size="sm">
                        Primary
                      </Badge>
                    )}
                  </div>

                  {/* Academic Info - Show if available */}
                  {(student.gradeLevel || student.section) && (
                    <div className="flex items-center gap-2 mt-2">
                      <FiBook className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {student.gradeLevel || 'Grade N/A'} {student.section ? `- ${student.section}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Status - Default to active */}
                  <div className="flex items-center justify-between mt-3">
                    <Badge 
                      variant="success"
                      size="sm"
                    >
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}

        {/* Add Student Button */}
        <Card 
          className="mt-6 border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary-500 hover:bg-white transition-all duration-200"
          onClick={() => router.push('/add-student')}
        >
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FiUser className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Add New Student</h4>
              <p className="text-sm text-gray-500">Scan QR code to add a student</p>
            </div>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Student Management Tips</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Keep student information up to date</li>
              <li>• Monitor attendance rates regularly</li>
              <li>• Contact the school if status shows as inactive</li>
            </ul>
          </div>
        </div>
      </div>
    </PullToRefresh>

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={showStudentDetail}
        onClose={() => {
          setShowStudentDetail(false);
          setSelectedStudentId(null);
        }}
        studentId={selectedStudentId || ''}
      />
    </MobileLayout>
  );
}