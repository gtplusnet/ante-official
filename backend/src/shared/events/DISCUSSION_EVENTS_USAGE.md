# Discussion Events System Usage Guide

This guide explains how to use the generic discussion event system in any module to automatically create and update discussions.

## Overview

The discussion event system allows any module to emit events that will automatically:
- Create discussions with initial messages
- Add update messages when entities change
- Track specific actions (approve, reject, assign, etc.)
- Sync watchers with the discussion

## Event Types

### 1. `discussion.create`
Creates a new discussion with an initial message and watchers.

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DISCUSSION_EVENTS } from '@shared/events/discussion.events';

// In your service
@Inject() private eventEmitter: EventEmitter2;

// Emit create event
this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
  module: 'Project',              // Your module name
  targetId: projectId.toString(), // Entity ID
  title: project.name,            // Discussion title
  actorId: userId,                // User creating the entity
  initialWatchers: [              // Array of user IDs to watch
    project.managerId,
    ...teamMemberIds
  ],
  timestamp: new Date().toISOString()
});
```

### 2. `discussion.update`
Sends update messages when entity fields change.

```typescript
// Track changes
const changes = [];
if (oldTitle !== newTitle) {
  changes.push({
    field: 'title',
    oldValue: oldTitle,
    newValue: newTitle,
    displayName: 'project name' // Optional readable name
  });
}

// Emit update event
if (changes.length > 0) {
  this.eventEmitter.emit(DISCUSSION_EVENTS.UPDATE, {
    module: 'Project',
    targetId: projectId.toString(),
    changes,
    actorId: userId,
    timestamp: new Date().toISOString()
  });
}
```

### 3. `discussion.action`
Tracks specific actions like approval, assignment, status changes.

```typescript
// Emit action event
this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, {
  module: 'PayrollSummary',
  targetId: payrollId,
  action: 'submitted_for_review',
  details: {
    period: 'January 2025',
    employeeCount: 150,
    totalAmount: 1500000
  },
  actorId: userId,
  timestamp: new Date().toISOString()
});
```

### 4. `discussion.message`
Sends a custom message to an existing discussion.

```typescript
this.eventEmitter.emit(DISCUSSION_EVENTS.MESSAGE, {
  module: 'Project',
  targetId: projectId.toString(),
  activity: 'commented',
  content: '<p>Project milestone completed!</p>',
  actorId: userId,
  timestamp: new Date().toISOString()
});
```

## Using the Helper Class

The `DiscussionEventHelper` provides convenient methods to create event payloads:

```typescript
import { DiscussionEventHelper } from '@shared/utils/discussion-event.helper';

// Create event
const event = DiscussionEventHelper.createEvent(
  'Project',
  projectId.toString(),
  project.name,
  userId,
  watcherIds
);
this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, event);

// Update event
const event = DiscussionEventHelper.updateEvent(
  'Project',
  projectId.toString(),
  changes,
  userId
);
this.eventEmitter.emit(DISCUSSION_EVENTS.UPDATE, event);

// Action event
const event = DiscussionEventHelper.actionEvent(
  'Project',
  projectId.toString(),
  'approved',
  { approverName: 'John Doe', comment: 'Looks good!' },
  userId
);
this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, event);
```

## Module Examples

### Project Module
```typescript
// When creating a project
this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
  module: 'Project',
  targetId: project.id.toString(),
  title: project.name,
  actorId: creatorId,
  initialWatchers: [project.managerId, ...project.teamMemberIds],
  timestamp: new Date().toISOString()
});

// When project status changes
this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, {
  module: 'Project',
  targetId: project.id.toString(),
  action: 'status_changed',
  details: {
    oldStatus: 'Planning',
    newStatus: 'In Progress'
  },
  actorId: userId,
  timestamp: new Date().toISOString()
});
```

### Payroll Module
```typescript
// When payroll is created
this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
  module: 'PayrollSummary',
  targetId: payroll.id,
  title: `Payroll for ${payroll.period}`,
  actorId: hrUserId,
  initialWatchers: [...payroll.approverIds, payroll.processedBy],
  timestamp: new Date().toISOString()
});

// When submitted for approval
this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, {
  module: 'PayrollSummary',
  targetId: payroll.id,
  action: 'submitted_for_review',
  details: {
    period: payroll.period,
    totalEmployees: payroll.employeeCount,
    totalAmount: payroll.totalAmount
  },
  actorId: submitterId,
  timestamp: new Date().toISOString()
});
```

### Employee Module
```typescript
// When employee details are updated
const changes = [];
if (oldDepartment !== newDepartment) {
  changes.push({
    field: 'department',
    oldValue: oldDepartment,
    newValue: newDepartment
  });
}

this.eventEmitter.emit(DISCUSSION_EVENTS.UPDATE, {
  module: 'EmployeeDetails',
  targetId: employeeId,
  changes,
  actorId: hrUserId,
  timestamp: new Date().toISOString()
});
```

## Supported Actions

The DiscussionEventListener automatically formats these common actions:
- `assigned` - Shows assignee name
- `claimed` - User claimed the task/item
- `accepted` - Assignment accepted
- `rejected` - Assignment rejected
- `status_changed` - Status transition
- `moved` - Moved between lanes/stages
- `approved` - Approval action
- `rejected_approval` - Rejection action
- `submitted_for_review` - Submission for review
- `completed` - Marked as complete

## Discussion ID Convention

By default, discussion IDs are generated as: `{MODULE}-{targetId}`

Examples:
- `TASK-123`
- `PROJECT-456`
- `PAYROLLSUMMARY-789`

You can override this by providing a custom `discussionId` in the event payload.

## Requirements

1. Import EventEmitter2 in your service:
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class YourService {
  @Inject() private eventEmitter: EventEmitter2;
}
```

2. Import event constants:
```typescript
import { DISCUSSION_EVENTS } from '@shared/events/discussion.events';
```

3. Emit events at appropriate points in your business logic.

## Benefits

- **Decoupled**: Your module doesn't need to know about discussion implementation
- **Consistent**: All modules use the same event structure
- **Automatic**: Discussions are created/updated without additional code
- **Auditable**: Complete history of all changes and actions
- **Extensible**: Easy to add new event types or customize behavior