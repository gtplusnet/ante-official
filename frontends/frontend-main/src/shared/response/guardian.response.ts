export interface GuardianResponse {
  id: string;
  name: string; // Formatted full name: "LastName, FirstName MiddleName"
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  email: string;
  contactNumber: string;
  alternateNumber: string | null;
  address: string | null;
  occupation: string | null;
  lastLogin: string | null;
  isActive: boolean;
  studentCount: number;
  students: ConnectedStudentInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedStudentInfo {
  id: string;
  studentNumber: string;
  name: string; // Formatted student name
  firstName: string;
  lastName: string;
  middleName: string | null;
  relationship: string;
  isPrimary: boolean;
}

export interface GuardianListResponse {
  id: string;
  name: string; // Formatted full name
  email: string;
}

export interface GuardianTableResponse {
  id: string;
  name: string; // Formatted full name
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  contactNumber: string;
  studentCount: number;
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
}
