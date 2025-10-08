import { IsString, IsOptional, IsEnum } from 'class-validator';

export class GetActivitiesQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(['all', 'read', 'unread'])
  filter?: 'all' | 'read' | 'unread';
}

export class MarkAsReadDto {
  @IsString()
  id: string;
}
