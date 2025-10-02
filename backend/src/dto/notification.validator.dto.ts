import { IsOptional } from 'class-validator';

export class NotificationFilterDto {
  @IsOptional()
  projectId: string;

  @IsOptional()
  isRead: boolean;
}
