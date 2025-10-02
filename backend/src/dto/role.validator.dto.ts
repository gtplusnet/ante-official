import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class RoleGetDTO {
  @IsNotEmpty()
  @IsString()
  readonly id: string;
}
export class RoleParentDTO {
  @IsNotEmpty()
  @IsString()
  readonly roleGroupId: string;
}
export class RoleDeleteDTO {
  @IsNotEmpty()
  @IsString()
  readonly id: string;
}
export class RoleCreateDTO {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsArray()
  readonly userLevelIds: number[];

  @IsOptional()
  @IsString()
  readonly parentRoleId?: string;

  @IsOptional()
  @IsBoolean()
  readonly isFullAccess?: boolean;

  @IsNotEmpty()
  @IsString()
  readonly roleGroupId: string;
}
export class RoleUpdateDTO {
  @IsNotEmpty()
  @IsString()
  readonly id: string;

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  readonly userLevelIds?: number[];

  @IsOptional()
  @IsString()
  readonly parentRoleId?: string;

  @IsOptional()
  @IsBoolean()
  readonly isFullAccess?: boolean;

  @IsOptional()
  @IsString()
  readonly roleGroupId?: string;
}
