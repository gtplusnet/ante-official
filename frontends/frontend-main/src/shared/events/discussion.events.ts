/**
 * Generic discussion event interfaces for cross-module communication
 */

export interface BaseDiscussionEvent {
  module: 'Task' | 'Project' | 'PayrollSummary' | 'EmployeeDetails' | string;
  targetId: string;
  discussionId?: string; // Optional - will be generated if not provided
  actorId: string;
  timestamp: string;
}

export interface DiscussionCreateEvent extends BaseDiscussionEvent {
  title: string;
  initialWatchers: string[];
}

export interface DiscussionMessageEvent extends BaseDiscussionEvent {
  activity: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface DiscussionUpdateEvent extends BaseDiscussionEvent {
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    displayName?: string;
  }>;
}

export interface DiscussionActionEvent extends BaseDiscussionEvent {
  action: string;
  details: Record<string, any>;
}

// Event names constants
export const DISCUSSION_EVENTS = {
  CREATE: 'discussion.create',
  MESSAGE: 'discussion.message',
  UPDATE: 'discussion.update',
  ACTION: 'discussion.action',
} as const;
