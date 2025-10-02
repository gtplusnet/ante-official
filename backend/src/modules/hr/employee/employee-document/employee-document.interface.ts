import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { EmployeeDocumentCategory } from '@prisma/client';

export class EmployeeDocumentUploadDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;

  @IsNotEmpty()
  @IsEnum(EmployeeDocumentCategory)
  category: EmployeeDocumentCategory;

  @IsNotEmpty()
  @IsString()
  documentType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class EmployeeDocumentUpdateDTO {
  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsEnum(EmployeeDocumentCategory)
  category?: EmployeeDocumentCategory;
}

export class EmployeeDocumentListDTO {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsOptional()
  @IsEnum(EmployeeDocumentCategory)
  category?: EmployeeDocumentCategory;

  @IsOptional()
  @IsString()
  isActive?: string;
}
