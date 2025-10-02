import {
  IsArray,
  IsOptional,
  IsNumber,
  IsIn,
  IsISO8601,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncPullDto {
  @IsISO8601()
  lastSyncTime: string;

  @IsArray()
  @IsIn(['student', 'guardian'], { each: true })
  entityTypes: ('student' | 'guardian')[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  limit?: number = 1000;
}

export class ValidateLicenseResponseDto {
  valid: boolean;
  companyId?: number;
  companyName?: string;
  gateName?: string | null;
  licenseType?: string;
  supabaseToken?: string;
  supabaseRefreshToken?: string;
}

export class StudentSyncDto {
  id: string;
  qrCode: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GuardianSyncDto {
  id: string;
  qrCode: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SyncMetadataDto {
  serverTime: string;
  syncId: string;
  studentCount: number;
  guardianCount: number;
}

export class SyncResponseDto {
  students: StudentSyncDto[];
  guardians: GuardianSyncDto[];
  hasMore: boolean;
  syncMetadata: SyncMetadataDto;
}

export class SyncStatusResponseDto {
  lastStudentSync: string | null;
  lastGuardianSync: string | null;
  totalStudents: number;
  totalGuardians: number;
  deviceName: string | null;
  isConnected: boolean;
}
