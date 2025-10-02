import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeRoleParentDto {
  @ApiProperty({
    description: 'ID of the role whose parent is being changed',
    example: 'role-123-abc-def',
  })
  @IsNotEmpty()
  @IsString()
  readonly roleId: string;

  @ApiPropertyOptional({
    description: 'ID of the new parent role (null for top-level roles)',
    example: 'role-456-ghi-jkl',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  readonly newParentId?: string | null;
}
