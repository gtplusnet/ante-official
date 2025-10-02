import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';
import {
  DiscussionCreateEvent,
  DiscussionMessageEvent,
  DiscussionUpdateEvent,
  DiscussionActionEvent,
  DISCUSSION_EVENTS,
} from '../shared/events/discussion.events';
import TaskPriorityReference from '../reference/task-priority.reference';
import TaskDifficultyReference from '../reference/task-difficulty.reference';

@Injectable()
export class DiscussionEventListener {
  @Inject() private discussionService: DiscussionService;

  constructor() {
    console.log('[DiscussionEventListener] Initialized');
  }

  @OnEvent(DISCUSSION_EVENTS.CREATE)
  async handleDiscussionCreate(event: DiscussionCreateEvent) {
    try {
      console.log('[DiscussionEventListener] Creating discussion:', event);

      // Skip discussion creation if no companyId (required by schema)
      if (!event.companyId) {
        console.log('[DiscussionEventListener] Skipping discussion creation - no companyId provided');
        return;
      }

      const discussionId =
        event.discussionId || `${event.module.toUpperCase()}-${event.targetId}`;

      // We need to modify the service to accept companyId as a parameter
      // For now, we'll set it on the utility service if available
      if (event.companyId && this.discussionService['utilityService']) {
        // Temporarily set companyId on utility service for this operation
        const originalCompanyId = this.discussionService['utilityService'].companyId;
        this.discussionService['utilityService'].companyId = event.companyId;

        try {
          // Create discussion with initial message
          await this.discussionService.createDiscussionMessage(
            {
              discussionId,
              module: event.module,
              targetId: event.targetId,
              title: event.title,
              content: '<em>Discussion created</em>',
              activity: 'created the discussion',
            },
            event.actorId,
          );

          // Sync initial watchers if provided (while companyId is still set)
          if (event.initialWatchers?.length > 0) {
            await this.discussionService.syncDiscussionWatchers(
              discussionId,
              event.initialWatchers,
            );
          }
        } finally {
          // Restore original companyId
          this.discussionService['utilityService'].companyId = originalCompanyId;
        }
      } else if (event.initialWatchers?.length > 0) {
        // If we couldn't set companyId but have watchers, log a warning
        console.log('[DiscussionEventListener] Cannot sync watchers - no companyId available');
      }
    } catch (error) {
      console.error(
        '[DiscussionEventListener] Error creating discussion:',
        error,
      );
    }
  }

  @OnEvent(DISCUSSION_EVENTS.MESSAGE)
  async handleDiscussionMessage(event: DiscussionMessageEvent) {
    try {
      console.log(
        '[DiscussionEventListener] Sending discussion message:',
        event,
      );

      const discussionId =
        event.discussionId || `${event.module.toUpperCase()}-${event.targetId}`;

      await this.discussionService.createDiscussionMessage(
        {
          discussionId,
          module: event.module,
          targetId: event.targetId,
          title: '', // Uses existing discussion title
          content: event.content,
          activity: event.activity,
        },
        event.actorId,
      );
    } catch (error) {
      console.error('[DiscussionEventListener] Error sending message:', error);
    }
  }

  @OnEvent(DISCUSSION_EVENTS.UPDATE)
  async handleDiscussionUpdate(event: DiscussionUpdateEvent) {
    try {
      console.log('[DiscussionEventListener] Handling update event:', event);

      const discussionId =
        event.discussionId || `${event.module.toUpperCase()}-${event.targetId}`;

      // Generate natural language message
      const content = this.generateNaturalUpdateMessage(
        event.module.toLowerCase(),
        event.changes,
      );

      await this.discussionService.createDiscussionMessage(
        {
          discussionId,
          module: event.module,
          targetId: event.targetId,
          title: '',
          content,
          activity: 'updated',
        },
        event.actorId,
      );
    } catch (error) {
      console.error('[DiscussionEventListener] Error handling update:', error);
    }
  }

  @OnEvent(DISCUSSION_EVENTS.ACTION)
  async handleDiscussionAction(event: DiscussionActionEvent) {
    try {
      console.log('[DiscussionEventListener] Handling action event:', event);

      const discussionId =
        event.discussionId || `${event.module.toUpperCase()}-${event.targetId}`;

      // Format content based on action and details
      const content = this.formatActionContent(event.action, event.details);

      await this.discussionService.createDiscussionMessage(
        {
          discussionId,
          module: event.module,
          targetId: event.targetId,
          title: '',
          content,
          activity: event.action,
        },
        event.actorId,
      );
    } catch (error) {
      console.error('[DiscussionEventListener] Error handling action:', error);
    }
  }

  private formatActionContent(
    action: string,
    details: Record<string, any>,
  ): string {
    // Common action formatters
    switch (action) {
      case 'assigned':
        return `<em>Assigned to ${details.assigneeName || details.assigneeId}</em>`;
      case 'claimed':
        return `<em>Claimed the task</em>`;
      case 'accepted':
        return `<em>Accepted the assignment</em>`;
      case 'rejected':
        return `<em>Rejected the assignment</em>`;
      case 'status_changed':
        return `<em>Changed status from ${details.oldStatus} to ${details.newStatus}</em>`;
      case 'moved':
        return `<em>Moved from ${details.fromLane} to ${details.toLane}</em>`;
      case 'approved':
        return `<em>Approved${details.comment ? ': ' + details.comment : ''}</em>`;
      case 'rejected_approval':
        return `<em>Rejected${details.reason ? ': ' + details.reason : ''}</em>`;
      case 'submitted_for_review':
        return `<em>Submitted for review${details.note ? ': ' + details.note : ''}</em>`;
      case 'completed':
        return `<em>Marked as completed</em>`;
      default:
        // Generic action with details
        if (Object.keys(details).length > 0) {
          const detailsText = Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          return `<em>${action} (${detailsText})</em>`;
        }
        return `<em>${action}</em>`;
    }
  }

  private formatDate(date: any): string {
    if (!date) return 'not set';
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return String(date);
    }
  }

  private getPriorityLabel(value: any): string {
    const numValue = Number(value);
    const priority = TaskPriorityReference.find((p) => p.key === numValue);
    return priority ? priority.label : `Priority ${value}`;
  }

  private getDifficultyLabel(value: any): string {
    const numValue = Number(value);
    const difficulty = TaskDifficultyReference.find((d) => d.key === numValue);
    return difficulty ? difficulty.label : `Difficulty ${value}`;
  }

  private formatFieldValue(field: string, value: any): string {
    switch (field) {
      case 'assignedToPrioritySet':
      case 'priority':
      case 'priorityLevel':
        return this.getPriorityLabel(value);
      case 'assignedToDifficultySet':
      case 'difficulty':
      case 'difficultyLevel':
        return this.getDifficultyLabel(value);
      default:
        return String(value);
    }
  }

  private generateNaturalUpdateMessage(module: string, changes: any[]): string {
    if (changes.length === 0) return '<em>Made an update.</em>';

    // Format individual changes
    const formattedChanges = changes.map((change) =>
      this.formatFieldChangeNaturally(change),
    );

    // Select a pattern based on number of changes
    if (changes.length === 1) {
      return `<em>${this.getSingleChangePattern(module, formattedChanges[0])}</em>`;
    } else {
      return `<em>${this.getMultipleChangesPattern(module, formattedChanges)}</em>`;
    }
  }

  private formatFieldChangeNaturally(change: any): string {
    const fieldName = change.displayName || change.field;

    // Handle null/undefined values
    if (change.oldValue === null || change.oldValue === undefined) {
      const formattedNewValue = this.formatFieldValue(
        change.field,
        change.newValue,
      );
      return this.getSetFieldPattern(fieldName, formattedNewValue);
    }

    if (change.newValue === null || change.newValue === undefined) {
      return this.getRemoveFieldPattern(fieldName);
    }

    // Format based on field type
    switch (change.field) {
      case 'title':
        return `renamed to '${change.newValue}'`;

      case 'description':
        return 'updated the description';

      case 'dueDate':
        return `set due date to ${this.formatDate(change.newValue)}`;

      case 'assignee':
        return `reassigned to ${change.newValue}`;

      case 'assignedToPrioritySet':
      case 'priority':
      case 'priorityLevel':
        const oldPriority = this.getPriorityLabel(change.oldValue);
        const newPriority = this.getPriorityLabel(change.newValue);
        return this.getPriorityChangePattern(oldPriority, newPriority);

      case 'assignedToDifficultySet':
      case 'difficulty':
      case 'difficultyLevel':
        const oldDifficulty = this.getDifficultyLabel(change.oldValue);
        const newDifficulty = this.getDifficultyLabel(change.newValue);
        return this.getDifficultyChangePattern(oldDifficulty, newDifficulty);

      default:
        return `changed ${fieldName} to '${change.newValue}'`;
    }
  }

  private getSingleChangePattern(module: string, change: string): string {
    const patterns = [
      `I've updated the ${module} - ${change}.`,
      `Just made a change to the ${module}: ${change}.`,
      `Updated: ${change}.`,
      `Made an update - ${change}.`,
    ];

    // Use a simple hash of the change to select pattern (for consistency)
    const index = Math.abs(this.simpleHash(change)) % patterns.length;
    return patterns[index];
  }

  private getMultipleChangesPattern(module: string, changes: string[]): string {
    // Join changes with proper grammar
    const joinedChanges = this.joinChangesNaturally(changes);

    const patterns = [
      `I've made a few updates to the ${module}: ${joinedChanges}.`,
      `Just updated the ${module} - ${joinedChanges}.`,
      `Made some changes: ${joinedChanges}.`,
      `Updated the ${module} with the following: ${joinedChanges}.`,
    ];

    // Use a simple hash to select pattern
    const index = Math.abs(this.simpleHash(joinedChanges)) % patterns.length;
    return patterns[index];
  }

  private joinChangesNaturally(changes: string[]): string {
    if (changes.length === 0) return '';
    if (changes.length === 1) return changes[0];
    if (changes.length === 2) return `${changes[0]} and ${changes[1]}`;

    // For 3+ items, use commas and 'and' before the last item
    const allButLast = changes.slice(0, -1).join(', ');
    const last = changes[changes.length - 1];
    return `${allButLast}, and ${last}`;
  }

  private getPriorityChangePattern(oldValue: string, newValue: string): string {
    const patterns = [
      `changed the priority to ${newValue} (was ${oldValue})`,
      `set priority to ${newValue}`,
      `priority is now ${newValue}`,
    ];
    const index =
      Math.abs(this.simpleHash(oldValue + newValue)) % patterns.length;
    return patterns[index];
  }

  private getDifficultyChangePattern(
    oldValue: string,
    newValue: string,
  ): string {
    const patterns = [
      `adjusted difficulty to ${newValue} (previously ${oldValue})`,
      `difficulty is now ${newValue}`,
      `changed difficulty level to ${newValue}`,
    ];
    const index =
      Math.abs(this.simpleHash(oldValue + newValue)) % patterns.length;
    return patterns[index];
  }

  private getSetFieldPattern(fieldName: string, value: string): string {
    const patterns = [
      `set ${fieldName} to ${value}`,
      `added ${fieldName}: ${value}`,
      `${fieldName} is now ${value}`,
    ];
    const index =
      Math.abs(this.simpleHash(fieldName + value)) % patterns.length;
    return patterns[index];
  }

  private getRemoveFieldPattern(fieldName: string): string {
    const patterns = [
      `removed the ${fieldName}`,
      `cleared the ${fieldName}`,
      `${fieldName} has been removed`,
    ];
    const index = Math.abs(this.simpleHash(fieldName)) % patterns.length;
    return patterns[index];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}
