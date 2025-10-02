import { EducationLevel } from '@prisma/client';

export interface GradeLevelCreateRequest {
  code: string;
  name: string;
  educationLevel: EducationLevel;
  sequence: number;
  ageRangeMin?: number;
  ageRangeMax?: number;
  description?: string;
}

export interface GradeLevelUpdateRequest extends GradeLevelCreateRequest {
  id: number;
  isActive?: boolean;
}
