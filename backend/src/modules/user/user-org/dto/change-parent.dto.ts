import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeParentDto {
  @ApiProperty({
    description: 'ID of the user whose parent is being changed',
    example: 'user-123-abc-def',
  })
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiPropertyOptional({
    description: 'ID of the new parent user (null for top-level users)',
    example: 'user-456-ghi-jkl',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  readonly newParentId?: string | null;
}
