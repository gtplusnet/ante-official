import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exists } from '@common/validators/exists.validator';
import { AccountCreateRequest } from '../../../shared/request/account.request';
import { ValidUsername } from '@common/validators/username.validator';

export class AccountGetDTO {
  @ApiProperty({ description: 'Account ID' })
  @IsNotEmpty()
  @IsString()
  readonly id: string;
}

export class ChangePasswordDTO {
  @ApiProperty({ description: 'User account ID' })
  @IsNotEmpty()
  @IsString()
  readonly id: string;

  @ApiProperty({ description: 'New password' })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}

export class AccountDeleteDTO {
  @ApiProperty({ description: 'Account ID to delete' })
  @IsNotEmpty()
  @IsString()
  readonly id: string;
}

export class AccountCreateDTO implements AccountCreateRequest {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsNotEmpty({ message: 'First name should not empty' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsNotEmpty({ message: 'Last name should not empty' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ description: 'Contact number', example: '+1234567890' })
  @IsNotEmpty({ message: 'Contact Number should not empty' })
  readonly contactNumber: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email should not empty' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @IsNotEmpty({ message: 'UserName should not empty' })
  @ValidUsername()
  username: string;

  @ApiProperty({ description: 'Password', example: 'SecurePass123!' })
  readonly password: string;

  @ApiProperty({ description: 'Role ID' })
  @IsNotEmpty({ message: 'Role ID should not empty' })
  @Exists('role', 'id', { message: 'Role does not exist.' })
  readonly roleID: string;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsOptional()
  readonly parentAccountId?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsOptional()
  readonly image?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  readonly companyId?: number;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsString()
  readonly sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Date of birth', type: Date })
  @IsOptional()
  readonly dateOfBirth?: Date;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['Male', 'Female', 'Other'],
  })
  @IsOptional()
  @IsString()
  readonly gender?: string;

  @ApiPropertyOptional({
    description: 'Civil status',
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
  })
  @IsOptional()
  @IsString()
  readonly civilStatus?: string;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  readonly street?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiPropertyOptional({ description: 'State or Province' })
  @IsOptional()
  @IsString()
  readonly stateProvince?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  readonly postalCode?: string;

  @ApiPropertyOptional({ description: 'ZIP code' })
  @IsOptional()
  @IsString()
  readonly zipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  readonly country?: string;
}

export class AccountUpdateDTO {
  @ApiProperty({ description: 'Account ID' })
  @IsNotEmpty()
  @IsString()
  readonly id: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  readonly middleName?: string;

  @ApiProperty({ description: 'First name' })
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({ description: 'Contact number' })
  @IsNotEmpty()
  readonly contactNumber: string;

  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ description: 'Username' })
  @IsNotEmpty()
  @ValidUsername()
  readonly username: string;

  @ApiProperty({ description: 'Role ID' })
  @IsNotEmpty()
  readonly roleID: string;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsOptional()
  readonly parentAccountId?: string;

  @ApiPropertyOptional({ description: 'Date of birth', type: Date })
  @IsOptional()
  readonly dateOfBirth?: Date;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: ['Male', 'Female', 'Other'],
  })
  @IsOptional()
  @IsString()
  readonly gender?: string;

  @ApiPropertyOptional({
    description: 'Civil status',
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
  })
  @IsOptional()
  @IsString()
  readonly civilStatus?: string;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  readonly street?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiPropertyOptional({ description: 'State or Province' })
  @IsOptional()
  @IsString()
  readonly stateProvince?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  readonly postalCode?: string;

  @ApiPropertyOptional({ description: 'ZIP code' })
  @IsOptional()
  @IsString()
  readonly zipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  readonly country?: string;
}
