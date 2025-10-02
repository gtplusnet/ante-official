// This file re-exports DTOs from student.validator.ts for backward compatibility
export {
  CreateStudentDto,
  UpdateStudentDto,
  StudentTableRequestDto,
  StudentPhotoUploadDto,
  StudentBulkImportDto,
} from './student.validator';

// Type aliases for backward compatibility
export { CreateStudentDto as StudentCreateDTO } from './student.validator';
export { UpdateStudentDto as StudentUpdateDTO } from './student.validator';
export { StudentTableRequestDto as StudentTableDTO } from './student.validator';
export { StudentPhotoUploadDto as StudentPhotoUploadDTO } from './student.validator';
export { StudentBulkImportDto as StudentBulkImportDTO } from './student.validator';
