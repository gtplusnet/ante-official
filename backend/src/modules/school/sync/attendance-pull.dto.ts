import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class AttendancePullRequestDto {
  @IsOptional()
  @IsString()
  lastSyncTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class AttendancePullRecordDto {
  id: string;
  qrCode: string;
  personId: string;
  personType: string;
  personName: string;
  action: string;
  timestamp: string;
  deviceId?: string;
  location?: string;
  profilePhoto?: string;
  createdAt: string;
}

export class AttendancePullResponseDto {
  records: AttendancePullRecordDto[];
  hasMore: boolean;
  serverTime: string;
}
