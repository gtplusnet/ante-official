import { LocationDataResponse } from './location.response';
import { FileDataResponse } from './file.response';

export interface StudentGuardianInfo {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  relationship: string;
}

export interface GradeLevel {
  id: number;
  code: string;
  name: string;
  educationLevel: string;
}

export interface Section {
  id: string;
  name: string;
  gradeLevelId: number;
  gradeLevel: GradeLevel;
  adviserName: string;
  schoolYear: string;
  capacity: number;
}

export interface StudentResponse {
  id: string;
  studentNumber: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  section: Section | null;
  location: LocationDataResponse | null;
  lrn: string | null;
  profilePhoto: FileDataResponse | null;
  dateRegistered: string;
  lastLogin: string | null;
  isActive: boolean;
  guardian: StudentGuardianInfo | null;
  strand: string | null;
  course: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListResponse {
  id: string;
  studentNumber: string;
  name: string;
}
