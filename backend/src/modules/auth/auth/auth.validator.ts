import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  LoginRequest,
  SignUpRequest,
} from '../../../shared/request/auth.request';
import { BusinessType, Industry } from '@prisma/client';
import { ValidUsername } from '../../../common/validators/username.validator';

export class AccountLoginDTO implements LoginRequest {
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
export class SignUPDTOCompanyInformation {
  @IsNotEmpty()
  @IsString()
  readonly companyName: string;

  @IsNotEmpty()
  @IsString()
  readonly domainPrefix: string;

  @IsNotEmpty()
  @IsEnum(BusinessType)
  readonly businessType: BusinessType;

  @IsNotEmpty()
  @IsEnum(Industry)
  readonly industry: Industry;

  @IsOptional()
  @IsString()
  readonly registrationNo?: string;

  @IsOptional()
  @IsString()
  readonly phone?: string;

  @IsOptional()
  @IsString()
  readonly tinNo?: string;
}

export class SignUpDTOAccountInformation {
  @IsNotEmpty()
  @IsString()
  readonly firstName: string;

  @IsNotEmpty()
  @IsString()
  readonly lastName: string;

  @IsNotEmpty()
  @IsString()
  readonly contactNumber: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @ValidUsername()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}

export class SignUpDTO implements SignUpRequest {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SignUPDTOCompanyInformation)
  readonly companyInformation: SignUPDTOCompanyInformation;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SignUpDTOAccountInformation)
  readonly accountInformation: SignUpDTOAccountInformation;

  @IsOptional()
  @IsString()
  readonly sourceUrl?: string;
}

export class GoogleLoginDTO {
  @IsNotEmpty()
  @IsString()
  readonly googleIdToken: string;
}

export class FacebookLoginDTO {
  @IsNotEmpty()
  @IsString()
  readonly facebookAccessToken: string;
}
