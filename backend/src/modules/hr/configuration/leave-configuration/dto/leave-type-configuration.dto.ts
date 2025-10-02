import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateLeaveTypeDto {
  @IsNotEmpty({ message: 'Leave type name is required' })
  @IsString({ message: 'Leave type name must be a string' })
  @MaxLength(100, { message: 'Leave type name cannot exceed 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Leave type code is required' })
  @IsString({ message: 'Leave type code must be a string' })
  @MaxLength(20, { message: 'Leave type code cannot exceed 20 characters' })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'Leave type code must contain only uppercase letters, numbers, and underscores',
  })
  code: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString({ message: 'Leave type name must be a string' })
  @MaxLength(100, { message: 'Leave type name cannot exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Leave type code must be a string' })
  @MaxLength(20, { message: 'Leave type code cannot exceed 20 characters' })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'Leave type code must contain only uppercase letters, numbers, and underscores',
  })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}
