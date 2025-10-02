import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  FiUser, 
  FiCalendar, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiBook,
  FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';

interface StudentDetail {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  email: string;
  contactNumber: string;
  address: {
    street: string;
    barangay: string;
    municipality: string;
    province: string;
  };
  gradeLevel: string;
  section: string;
  lrn?: string;
  status: 'active' | 'inactive';
  lastAttendance?: {
    date: string;
    time: string;
    type: 'entry' | 'exit';
  };
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

// Mock data - in real app, this would fetch from API
const mockStudentDetail: StudentDetail = {
  id: '1',
  studentNumber: '2025-000123',
  firstName: 'Juan Miguel',
  lastName: 'Dela Cruz',
  middleName: 'Santos',
  dateOfBirth: '2010-03-15',
  gender: 'Male',
  email: 'juan.delacruz@school.edu',
  contactNumber: '+639123456789',
  address: {
    street: '123 Mabini St.',
    barangay: 'Barangay San Jose',
    municipality: 'Santa Maria',
    province: 'Bulacan'
  },
  gradeLevel: 'Grade 6',
  section: 'St. Joseph',
  lrn: '123456789012',
  status: 'active',
  lastAttendance: {
    date: '2025-07-01',
    time: '08:05 AM',
    type: 'entry'
  }
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  // In real app, fetch student details based on studentId
  const student = mockStudentDetail;
  
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
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-gray-600">
              {student.firstName[0]}{student.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {student.firstName} {student.middleName} {student.lastName}
            </h2>
            <p className="text-gray-600">Student No: {student.studentNumber}</p>
            <div className="mt-2">
              <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                {student.status === 'active' ? 'Active' : 'Inactive'}
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
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiBook className="w-5 h-5 text-primary-500" />
            Academic Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Grade Level</p>
              <p className="font-medium">{student.gradeLevel}</p>
            </div>
            <div>
              <p className="text-gray-500">Section</p>
              <p className="font-medium">{student.section}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiPhone className="w-5 h-5 text-primary-500" />
            Contact Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FiMail className="w-4 h-4 text-gray-400" />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span>{student.contactNumber}</span>
            </div>
            <div className="flex items-start gap-2">
              <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span>
                {student.address.street}, {student.address.barangay}, 
                {student.address.municipality}, {student.address.province}
              </span>
            </div>
          </div>
        </div>


        {/* Last Attendance */}
        {student.lastAttendance && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-primary-500" />
              Last Attendance
            </h3>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                {student.lastAttendance.type === 'entry' ? 'Entered' : 'Left'} the school on{' '}
                <span className="font-medium">
                  {format(new Date(student.lastAttendance.date), 'MMMM d, yyyy')}
                </span>{' '}
                at <span className="font-medium">{student.lastAttendance.time}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};