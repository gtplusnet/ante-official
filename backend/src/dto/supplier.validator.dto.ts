import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma, PaymentTerms, TaxType } from '@prisma/client';
export class CreateSupplierPaymentDetailsDTO {
  @IsNotEmpty()
  @IsString()
  term: string;

  @IsNumber()
  percentage: number;

  @IsNumber()
  days: number;

  @IsNumber()
  lateFees: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;
}
export class UpdateSupplierPaymentDetailsDTO {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  days?: number;

  @IsOptional()
  @IsNumber()
  lateFees?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;
}
export class CreateSupplierDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  locationId?: Prisma.LocationWhereUniqueInput;

  @IsOptional()
  @IsString()
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsString()
  taxType?: TaxType;
}
export class AddSupplierPaymentDetailsDTO {
  @IsNotEmpty()
  @IsString()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPaymentDetailsDTO)
  supplierPaymentDetails: CreateSupplierPaymentDetailsDTO[];
}
