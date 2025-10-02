import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEmail,
  MinLength,
  IsUUID,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStudentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  studentNumber?: string; // Optional - will auto-generate if not provided

  @Transform(({ value }) => {
    // Convert YYYY/MM/DD to ISO 8601 format
    if (typeof value === 'string' && value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      return value.replace(/\//g, '-');
    }
    return value;
  })
  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender: string;

  @IsUUID()
  sectionId: string; // Required section

  @IsString()
  @IsOptional()
  lrn?: string; // Learner Reference Number

  @IsNumber()
  @IsOptional()
  profilePhotoId?: number;

  @IsString()
  @IsOptional()
  temporaryGuardianName?: string;

  @IsString()
  @IsOptional()
  temporaryGuardianAddress?: string;

  @IsString()
  @IsOptional()
  temporaryGuardianContactNumber?: string;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  studentNumber?: string; // Now editable

  @Transform(({ value }) => {
    // Convert YYYY/MM/DD to ISO 8601 format
    if (typeof value === 'string' && value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      return value.replace(/\//g, '-');
    }
    return value;
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  @IsOptional()
  gender?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsOptional()
  lrn?: string;

  @IsNumber()
  @IsOptional()
  profilePhotoId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  temporaryGuardianName?: string;

  @IsString()
  @IsOptional()
  temporaryGuardianAddress?: string;

  @IsString()
  @IsOptional()
  temporaryGuardianContactNumber?: string;
}

export class StudentTableRequestDto {
  @IsString()
  @IsOptional()
  searchKeyword?: string;

  @IsString()
  @IsOptional()
  searchBy?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class StudentPhotoUploadDto {
  @IsUUID()
  studentId: string;

  @IsNumber()
  fileId: number;
}

// Password reset DTO removed - students no longer have accounts

export class StudentBulkImportDto {
  @IsString()
  fileId: string;
}
