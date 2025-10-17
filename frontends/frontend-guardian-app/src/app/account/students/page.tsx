'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { guardianPublicApi } from '@/lib/api/guardian-public-api';
import { 
  FiUser, 
  FiUserX,
  FiCalendar,
  FiAlertCircle,
  FiPlus,
  FiChevronRight,
  FiBook
} from 'react-icons/fi';
import { format } from 'date-fns';


export default function ManageStudentsPage() {
  const router = useRouter();
  const { user, loading, refreshAuth } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string>('');
  
  const students = user?.students || [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      setIsRemoving(true);
      setError('');
      
      // Call API to disconnect student
      await guardianPublicApi.removeStudent(selectedStudent);
      
      // Refresh auth context to update user's students
      await refreshAuth();
      
      // Check if this was the last student
      const remainingStudents = user?.students?.filter(s => s.id !== selectedStudent) || [];
      
      if (remainingStudents.length === 0) {
        // Small delay to ensure state updates are complete
        setTimeout(() => {
          // Redirect to add-student page if no students left
          router.push('/add-student');
        }, 100);
      } else {
        // Close the modal if there are still students
        setShowRemoveConfirm(false);
        setSelectedStudent(null);
      }
    } catch (error: any) {
      console.error('Failed to remove student:', error);
      setError(error.message || 'Failed to remove student. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const confirmRemove = (studentId: string) => {
    setSelectedStudent(studentId);
    setShowRemoveConfirm(true);
    setError('');
  };
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <MobileLayout className="bg-gray-50">
      <LoadingOverlay isLoading={isRemoving} message="Removing student..." />
      <Header 
        title="Manage Students" 
        showMenu={false}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Info Section */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Managing Student Connections</h4>
              <p className="text-sm text-blue-800">
                You can manage which students are connected to your guardian account. 
                Removing a student will stop all notifications for that student.
              </p>
            </div>
          </div>
        </Card>

        {/* Connected Students */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Connected Students ({students.length})
          </h3>
          
          <div className="space-y-4">
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
                </div>
              </Card>
            ) : (
              students.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Student Photo/Initials */}
                    <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-gray-600">
                        {getInitials(student.firstName, student.lastName)}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Student No: {student.studentNumber}
                          </p>
                          {(student.section?.gradeLevel?.name || student.section?.name) && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <FiBook className="w-3 h-3" />
                              {student.section?.gradeLevel?.name || 'Grade N/A'} {student.section?.name ? `- ${student.section.name}` : ''}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="success"
                          size="sm"
                        >
                          Active
                        </Badge>
                      </div>

                      {/* Connection Details */}
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-3 h-3" />
                          <span>Relationship: {student.relationship}</span>
                        </div>
                        {student.isPrimary && (
                          <Badge variant="info" size="sm">
                            Primary Guardian
                          </Badge>
                        )}
                      </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/students?id=${student.id}`)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmRemove(student.id)}
                        className="flex-1 !text-red-600 hover:!bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </div>

        {/* Add New Student */}
        <Card 
          className="border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary-500 hover:bg-white transition-all duration-200"
          onClick={() => router.push('/add-student')}
        >
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <FiPlus className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Add New Student</h4>
              <p className="text-sm text-gray-500">Scan QR code to connect</p>
            </div>
            <FiChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </div>
        </Card>

        {/* Connection History Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help connecting a student?
          </p>
          <button 
            onClick={() => router.push('/account/help')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
          >
            Visit Help Center
          </button>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUserX className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Student?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to remove{' '}
                <span className="font-semibold">
                  {students.find(s => s.id === selectedStudent)?.firstName}{' '}
                  {students.find(s => s.id === selectedStudent)?.lastName}
                </span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                You will stop receiving all notifications for this student.
              </p>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setSelectedStudent(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRemoveStudent}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                  disabled={isRemoving}
                  loading={isRemoving}
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </MobileLayout>
  );
}