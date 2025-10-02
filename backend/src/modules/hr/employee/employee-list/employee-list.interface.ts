import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from '@common/validators/exists.validator';
import { EmploymentStatus } from '@prisma/client';
import { AccountCreateDTO } from '@modules/account/account/account.validator';
import { IsDateGreaterThan } from '@common/dto/validators/date-range.validator';
import { ContractDataCreateRequest } from '../../../../shared/request/contract.request';

export class EmployeeConctractDetailsDTO implements ContractDataCreateRequest {
  @IsNotEmpty()
  @IsNumber()
  monthlyRate: number;

  @IsNotEmpty()
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;

  @IsDateString()
  @IsNotEmpty({ message: 'Start date is required.' })
  startDate: string;

  @IsOptional()
  @IsDateString()
  @IsDateGreaterThan('startDate')
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Exists('files', 'id', { message: 'Contract file does not exist.' })
  contractFileId: number;
}

export class EmployeeCreateDTO {
  @IsNotEmpty()
  @IsString()
  employeeCode: string;

  @IsOptional()
  @IsString()
  @Exists('account', 'id', { message: 'Account does not exist.' })
  existingAccountId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccountCreateDTO)
  accountDetails: AccountCreateDTO;

  @IsNotEmpty()
  @IsNumber()
  @Exists('payrollGroup', 'id', { message: 'Payroll Group does not exist.' })
  payrollGroupId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('schedule', 'id', { message: 'Schedule does not exist.' })
  scheduleId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('project', 'id', { message: 'Branch does not exist.' })
  branchId: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmployeeConctractDetailsDTO)
  contractDetails: EmployeeConctractDetailsDTO;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsOptional()
  @IsString()
  sssNumber?: string;

  @IsOptional()
  @IsString()
  hdmfNumber?: string;

  @IsOptional()
  @IsString()
  phicNumber?: string;
}

export class EmployeeUpdateDTO extends EmployeeCreateDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeConctractDetailsDTO)
  contractDetails: EmployeeConctractDetailsDTO;
}

export class EmployeeGetDTO {
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class EmployeeDeleteDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;
}

export class EmployeeRestoreDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;
}

export class JobDetailsDTO {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  biometricsNumber?: string;
}

export class GovernmentDetailsDTO {
  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsOptional()
  @IsString()
  sssNumber?: string;

  @IsOptional()
  @IsString()
  hdmfNumber?: string;

  @IsOptional()
  @IsString()
  phicNumber?: string;
}

export class EmployeeJobDetailsUpdateDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => JobDetailsDTO)
  jobDetails: JobDetailsDTO;

  @IsOptional()
  @IsNumber()
  @Exists('project', 'id', { message: 'Branch does not exist.' })
  branchId?: number;

  @IsOptional()
  @IsString()
  @Exists('role', 'id', { message: 'Role does not exist.' })
  roleId?: string;

  @IsOptional()
  @IsString()
  @Exists('account', 'id', { message: 'Parent account does not exist.' })
  parentAccountId?: string;
}

export class EmployeeGovernmentDetailsUpdateDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GovernmentDetailsDTO)
  governmentDetails: GovernmentDetailsDTO;
}

export class AddContractRequestDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('account', 'id', { message: 'Account does not exist.' })
  accountId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmployeeConctractDetailsDTO)
  contractData: EmployeeConctractDetailsDTO;
}

export class EditContractRequestDTO {
  @IsNotEmpty()
  @IsNumber()
  contractId: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmployeeConctractDetailsDTO)
  contractData: EmployeeConctractDetailsDTO;
}

export class SetContractInactiveRequestDTO {
  @IsNotEmpty()
  @IsNumber()
  contractId: number;
}

export class EmployeeScheduleUpdateDTO {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId', {
    message: 'Employee account does not exist.',
  })
  accountId: string;

  @IsNotEmpty()
  @IsNumber()
  @Exists('schedule', 'id', { message: 'Schedule does not exist.' })
  scheduleId: number;
}
