import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SendInviteDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  roleID: string;

  @IsString()
  @IsOptional()
  parentAccountId?: string;
}

export class AcceptInviteDTO {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s-()]+$/, {
    message: 'Invalid contact number format',
  })
  contactNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}

export class ResendInviteDTO {
  @IsString()
  @IsNotEmpty()
  inviteId: string;
}

export class CancelInviteDTO {
  @IsString()
  @IsNotEmpty()
  inviteId: string;
}

export class VerifyInviteTokenDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class AcceptInviteWithGoogleDTO {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  googleIdToken: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s-()]+$/, {
    message: 'Invalid contact number format',
  })
  contactNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}

export class AcceptInviteWithFacebookDTO {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  facebookAccessToken: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s-()]+$/, {
    message: 'Invalid contact number format',
  })
  contactNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}
