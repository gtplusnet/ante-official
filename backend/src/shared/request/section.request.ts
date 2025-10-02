export interface SectionRequest {
  name: string;
  gradeLevelId: number;
  adviserName: string;
  schoolYear: string;
  capacity?: number;
}

export interface SectionCreateRequest extends SectionRequest {}

export interface SectionUpdateRequest extends Partial<SectionRequest> {
  isActive?: boolean;
}

export interface SectionTableRequest {
  searchKeyword?: string;
  gradeLevelId?: number;
  schoolYear?: string;
  isActive?: boolean;
}