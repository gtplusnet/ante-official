import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  ValidateNested,
  MinLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SignUpCompany } from '../../../shared/request';
import { BusinessType, Industry } from '@prisma/client';

export class CompanyCreateDTO implements SignUpCompany {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  domainPrefix: string;

  @IsNotEmpty()
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsNotEmpty()
  @IsEnum(Industry)
  industry: Industry;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tinNo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledModules?: string[];
}

export class InitialUserDTO {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;
}

export class CompanyWithInitialUserDTO {
  @IsNotEmpty()
  @Type(() => CompanyCreateDTO)
  @ValidateNested()
  company: CompanyCreateDTO;

  @IsNotEmpty()
  @Type(() => InitialUserDTO)
  @ValidateNested()
  user: InitialUserDTO;
}
