import { FileDataResponse } from './file.response';

export interface StudentGuardianInfo {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  relationship: string;
}

export interface SectionInfo {
  id: string;
  name: string;
  gradeLevelId: number;
  gradeLevel: {
    id: number;
    code: string;
    name: string;
    educationLevel: string;
  } | null;
  adviserName: string;
  schoolYear: string;
  capacity: number | null;
}

export interface StudentResponse {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  section: SectionInfo | null;
  lrn: string | null;
  profilePhoto: FileDataResponse | null;
  dateRegistered: string;
  isActive: boolean;
  guardian: StudentGuardianInfo | null;
  temporaryGuardianName: string | null;
  temporaryGuardianAddress: string | null;
  temporaryGuardianContactNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListResponse {
  id: string;
  studentNumber: string;
  name: string;
}
