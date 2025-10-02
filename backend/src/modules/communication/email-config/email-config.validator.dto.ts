import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { EmailProtocol, EmailProvider } from '@prisma/client';

export class CreateEmailConfigDto {
  @IsEnum(EmailProvider)
  emailProvider: EmailProvider;

  @IsEnum(EmailProtocol)
  emailProtocol: EmailProtocol;

  @IsString()
  incomingServer: string;

  @IsNumber()
  incomingPort: number;

  @IsBoolean()
  @IsOptional()
  incomingSSL?: boolean = true;

  @IsString()
  outgoingServer: string;

  @IsNumber()
  outgoingPort: number;

  @IsBoolean()
  @IsOptional()
  outgoingSSL?: boolean = true;

  @IsEmail()
  emailAddress: string;

  @IsString()
  emailPassword: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateEmailConfigDto extends CreateEmailConfigDto {
  @IsString()
  @IsOptional()
  id?: string;
}

export class TestEmailConnectionDto {
  @IsEnum(EmailProvider)
  emailProvider: EmailProvider;

  @IsEnum(EmailProtocol)
  emailProtocol: EmailProtocol;

  @IsString()
  incomingServer: string;

  @IsNumber()
  incomingPort: number;

  @IsBoolean()
  incomingSSL: boolean;

  @IsString()
  outgoingServer: string;

  @IsNumber()
  outgoingPort: number;

  @IsBoolean()
  outgoingSSL: boolean;

  @IsEmail()
  emailAddress: string;

  @IsString()
  emailPassword: string;
}
