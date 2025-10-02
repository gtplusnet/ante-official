import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEmail,
  MinLength,
  IsUUID,
} from 'class-validator';

export class GuardianCreateDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  contactNumber: string;

  @IsString()
  @IsOptional()
  alternateNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;
}

export class GuardianUpdateDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEmail()
  email: string;

  @IsString()
  contactNumber: string;

  @IsString()
  @IsOptional()
  alternateNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GuardianResetPasswordDTO {
  @IsUUID()
  guardianId: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AssignStudentDTO {
  @IsUUID()
  guardianId: string;

  @IsUUID()
  studentId: string;

  @IsString()
  relationship: string; // Father, Mother, Guardian, etc.

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class RemoveStudentDTO {
  @IsUUID()
  guardianId: string;

  @IsUUID()
  studentId: string;
}
