import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  FiUser, 
  FiBook
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { StudentFullInfo } from '@/types/api.types';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const { user, loading } = useAuth();
  
  // Find the selected student from the user's students array
  const student: StudentFullInfo | undefined = user?.students?.find(
    (s) => s.id === studentId
  );
  
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Handle loading state
  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Student Information"
        size="lg"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading student information...</div>
        </div>
      </Modal>
    );
  }

  // Handle student not found
  if (!student) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Student Information"
        size="lg"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Student not found</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Information"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with Photo and Basic Info */}
        <div className="flex items-start gap-4">
          {student.profilePhoto?.url ? (
            <img 
              src={student.profilePhoto.url} 
              alt={`${student.firstName} ${student.lastName}`}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-[2px] border-black"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-semibold text-gray-600">
                {student.firstName[0]}{student.lastName[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
            </h2>
            <p className="text-gray-600">Student No: {student.studentNumber}</p>
            <div className="mt-2">
              <Badge variant={student.isActive ? 'success' : 'default'}>
                {student.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-primary-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium">{student.gender}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {format(new Date(student.dateOfBirth), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium">{calculateAge(student.dateOfBirth)} years old</p>
            </div>
            <div>
              <p className="text-gray-500">LRN</p>
              <p className="font-medium">{student.lrn || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        {student.section && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiBook className="w-5 h-5 text-primary-500" />
              Academic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Grade Level</p>
                <p className="font-medium">
                  {student.section.gradeLevel?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Section</p>
                <p className="font-medium">{student.section.name}</p>
              </div>
              {student.section.adviserName && (
                <>
                  <div>
                    <p className="text-gray-500">Adviser</p>
                    <p className="font-medium">{student.section.adviserName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">School Year</p>
                    <p className="font-medium">{student.section.schoolYear}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};