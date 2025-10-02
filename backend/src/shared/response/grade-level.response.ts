import { EducationLevel } from '@prisma/client';

export interface GradeLevelResponse {
  id: number;
  code: string;
  name: string;
  educationLevel: EducationLevel;
  sequence: number;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  description: string | null;
  companyId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
