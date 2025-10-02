import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkGoogleAccountDto {
  @ApiProperty({ description: 'Google OAuth ID token' })
  @IsString()
  @IsNotEmpty()
  googleIdToken: string;
}

export class LinkFacebookAccountDto {
  @ApiProperty({ description: 'Facebook OAuth access token' })
  @IsString()
  @IsNotEmpty()
  facebookAccessToken: string;
}

export class SetPasswordDto {
  @ApiProperty({ description: 'New password to set' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'Current password (required if user already has a password)',
  })
  @IsString()
  @IsOptional()
  currentPassword?: string; // Required if user already has a password
}

export interface AuthMethodsResponse {
  hasPassword: boolean;
  hasGoogle: boolean;
  hasFacebook: boolean;
  googleEmail?: string;
  facebookEmail?: string;
  primaryMethod: 'LOCAL' | 'GOOGLE' | 'FACEBOOK';
  connectedMethods: number;
}
