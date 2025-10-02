export interface StudentRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  studentNumber?: string; // Optional - will auto-generate if not provided
  dateOfBirth: string;
  gender: string;
  locationId?: string;
  lrn?: string;
  password?: string;
  email: string;
  username: string;
  profilePhotoId?: number;
  isActive?: boolean;
}

export interface StudentCreateRequest extends StudentRequest {
  password: string;
}

export interface StudentUpdateRequest extends Partial<StudentRequest> {
  id: string;
}

export interface StudentTableRequest {
  searchKeyword?: string;
  searchBy?: string;
  isActive?: boolean;
}

export interface StudentPhotoUploadRequest {
  studentId: string;
  fileId: number;
}

export interface StudentBulkImportRequest {
  fileId: string;
}

export interface StudentResetPasswordRequest {
  studentId: string;
  newPassword: string;
}
