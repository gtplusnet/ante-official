import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsObject,
  IsEmail,
} from 'class-validator';
import { SendEmailApprovalRequest } from '@shared/request';

export class CreateEmailApprovalDto implements SendEmailApprovalRequest {
  @IsNotEmpty()
  @IsNumber()
  taskId: number;

  @IsNotEmpty()
  @IsString()
  approverId: string;

  @IsNotEmpty()
  @IsString()
  module: string;

  @IsNotEmpty()
  @IsString()
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsNotEmpty()
  @IsObject()
  approvalData: Record<string, any>;

  @IsNotEmpty()
  @IsEmail()
  recipientEmail: string;
}
