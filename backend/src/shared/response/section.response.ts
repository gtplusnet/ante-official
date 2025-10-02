export interface SectionResponse {
  id: string;
  name: string;
  gradeLevelId: number;
  gradeLevel: {
    id: number;
    code: string;
    name: string;
    educationLevel: string;
    sequence: number;
  } | undefined;
  adviserName: string;
  schoolYear: string;
  capacity: number | null;
  studentCount: number;
  students?: Array<{
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionListResponse {
  id: string;
  name: string;
  gradeLevel: string;
  adviserName: string;
  schoolYear: string;
  studentCount: number;
}