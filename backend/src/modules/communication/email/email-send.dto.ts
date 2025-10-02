import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class EmailAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  path?: string;
}

export class SendEmailDto {
  @IsEmail({}, { each: true })
  @Type(() => String)
  to: string | string[];

  @IsEmail({}, { each: true })
  @IsOptional()
  @Type(() => String)
  cc?: string | string[];

  @IsEmail({}, { each: true })
  @IsOptional()
  @Type(() => String)
  bcc?: string | string[];

  @IsString()
  subject: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  html?: string;

  @IsArray()
  @IsOptional()
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}
