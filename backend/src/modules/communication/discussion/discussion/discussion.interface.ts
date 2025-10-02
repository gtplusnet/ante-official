// DTOs and interfaces for Discussion module

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
} from 'class-validator';
import {
  CreateDiscussionMessageRequest,
  EditDiscussionMessageRequest,
  DiscussionGetInfoRequest,
} from '../../../../shared/request/discussion.request';
import { TableRequest } from '../../../../shared/request/table.request';

export class CreateDiscussionMessageDto
  implements Omit<CreateDiscussionMessageRequest, 'messageId'>
{
  @IsNotEmpty()
  @IsString()
  discussionId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  module: string;

  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsNotEmpty()
  @IsString()
  activity: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  attachmentId?: number;
}

export class EditDiscussionMessageDto implements EditDiscussionMessageRequest {
  @IsNotEmpty()
  @IsNumber()
  messageId: number;

  @IsNotEmpty()
  @IsString()
  content: string;
}

export class TableDto implements TableRequest {
  @IsNumber()
  page: number;

  @IsNumber()
  perPage: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortType?: 'asc' | 'desc';

  @IsOptional()
  @IsArray()
  filters?: Record<string, any>[];

  @IsOptional()
  settings?: object;

  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @IsOptional()
  @IsString()
  searchBy?: string;
}

export class DiscussionTableDto extends TableDto {}

export class DiscussionGetInfoDto implements DiscussionGetInfoRequest {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class SyncDiscussionWatchersDto {
  @IsNotEmpty()
  @IsString()
  discussionId: string;

  @IsArray()
  @IsString({ each: true })
  taskRelatedIds: string[];
}

export class GetDiscussionWatchersDto {
  @IsNotEmpty()
  @IsString()
  discussionId: string;
}
