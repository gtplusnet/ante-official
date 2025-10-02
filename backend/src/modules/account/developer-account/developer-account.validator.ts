import {
  IsString,
  IsEmail,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class DeveloperAccountGetDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class DeveloperAccountCreateDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
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
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(200)
  password: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  companyId?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isDeveloper?: boolean;
}

export class DeveloperAccountUpdateDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(200)
  password?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  companyId?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isDeveloper?: boolean;
}

export class DeveloperAccountDeleteDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
