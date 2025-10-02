import React from 'react';
import { Student } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface StudentCardProps {
  student: Student;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Student Photo */}
      <div className="relative">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-600 font-medium">
              {student.name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>
      </div>

      {/* Student Info */}
      <div className="flex-1">
        <p className="font-medium text-gray-900">{student.name}</p>
      </div>

      {/* Status Badge */}
      <Badge 
        variant={student.currentStatus === 'in_school' ? 'success' : 'default'}
        size="sm"
      >
        {student.currentStatus === 'in_school' ? 'In School' : 'Inactive'}
      </Badge>
    </div>
  );
};