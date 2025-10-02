import {
  DiscussionCreateEvent,
  DiscussionUpdateEvent,
  DiscussionActionEvent,
  DiscussionMessageEvent,
} from '../events/discussion.events';

/**
 * Helper class for creating discussion event payloads
 */
export class DiscussionEventHelper {
  /**
   * Create a discussion creation event
   */
  static createEvent(
    module: string,
    targetId: string,
    title: string,
    actorId: string,
    watchers: string[],
    discussionId?: string,
  ): DiscussionCreateEvent {
    return {
      module,
      targetId,
      discussionId,
      title,
      actorId,
      initialWatchers: watchers,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a discussion update event
   */
  static updateEvent(
    module: string,
    targetId: string,
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      displayName?: string;
    }>,
    actorId: string,
    discussionId?: string,
  ): DiscussionUpdateEvent {
    return {
      module,
      targetId,
      discussionId,
      changes,
      actorId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a discussion action event
   */
  static actionEvent(
    module: string,
    targetId: string,
    action: string,
    details: Record<string, any>,
    actorId: string,
    discussionId?: string,
  ): DiscussionActionEvent {
    return {
      module,
      targetId,
      discussionId,
      action,
      details,
      actorId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a discussion message event
   */
  static messageEvent(
    module: string,
    targetId: string,
    activity: string,
    content: string,
    actorId: string,
    metadata?: Record<string, any>,
    discussionId?: string,
  ): DiscussionMessageEvent {
    return {
      module,
      targetId,
      discussionId,
      activity,
      content,
      metadata,
      actorId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format field names for display
   */
  static formatFieldName(field: string): string {
    // Convert camelCase to human readable
    return field
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Format value for display
   */
  static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'not set';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }
}
