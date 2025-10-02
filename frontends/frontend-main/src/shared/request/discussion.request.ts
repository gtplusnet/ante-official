// Discussion request interfaces

export interface CreateDiscussionMessageRequest {
  discussionId: string;
  title: string;
  module: string;
  targetId: string;
  activity: string;
  content: string;
  attachmentId?: number;
}

export interface EditDiscussionMessageRequest {
  messageId: number;
  content: string;
}

export interface DiscussionTableRequest {
  page: number;
  perPage: number;
  sort?: string;
  sortType?: 'asc' | 'desc';
  filters?: Record<string, any>[];
  searchKeyword?: string;
  searchBy?: string;
}

export interface DiscussionGetInfoRequest {
  id: string;
}
