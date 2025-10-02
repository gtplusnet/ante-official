import { DateFormat } from './utility.format';
import { AccountDataResponse } from './account.response';
import { FileDataResponse } from './file.response';

// Discussion response interfaces

export interface DiscussionMessageResponse {
  id: number;
  discussionId: number;
  activity: string;
  content: string;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  accountId: string;
  account: AccountDataResponse;
  attachment?: FileDataResponse;
}

export interface DiscussionResponse {
  id: string;
  title: string;
  module: string;
  targetId: string;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  messages?: DiscussionMessageResponse[];
}
