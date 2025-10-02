import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  Matches,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
export class GuardianLoginDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return parseInt(value);
  })
  companyId?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
export class GuardianRegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsString()
  @Matches(/^(\+63|0)?9\d{9}$/, {
    message: 'Please enter a valid Philippine mobile number',
  })
  contactNumber: string;

  @IsOptional()
  @IsString()
  alternateNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  companyId: number;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
export class VerifyOtpDto {
  @IsString()
  guardianId: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be 6 digits',
  })
  otp: string;
}
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
