import { IsString, IsNotEmpty, Matches, IsEnum } from 'class-validator';

export enum GuardianRelationship {
  FATHER = 'Father',
  MOTHER = 'Mother',
  GUARDIAN = 'Guardian',
  GRANDFATHER = 'Grandfather',
  GRANDMOTHER = 'Grandmother',
  UNCLE = 'Uncle',
  AUNT = 'Aunt',
  BROTHER = 'Brother',
  SISTER = 'Sister',
  OTHER = 'Other',
}

export class ConnectStudentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^student:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    {
      message: 'Invalid QR code format. Expected format: student:<uuid>',
    },
  )
  qrCode: string;

  @IsEnum(GuardianRelationship)
  @IsNotEmpty()
  relationship: GuardianRelationship;
}

export class DisconnectStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
