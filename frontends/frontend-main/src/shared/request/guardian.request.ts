export interface GuardianRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  email: string;
  password?: string; // Required for create, optional for update
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  isActive?: boolean;
}

export interface GuardianTableRequest {
  searchKeyword?: string;
  searchBy?: string;
  isActive?: boolean;
}

export interface GuardianResetPasswordRequest {
  guardianId: string;
  newPassword: string;
}

export interface AssignStudentRequest {
  guardianId: string;
  studentId: string;
  relationship: string;
  isPrimary?: boolean;
}

export interface RemoveStudentRequest {
  guardianId: string;
  studentId: string;
}
