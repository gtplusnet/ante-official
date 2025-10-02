# Shared Interfaces Guide

This guide explains how to use shared interfaces between frontend and backend in the GEER-ANTE ERP system.

## Directory Structure

```
ante/
├── backend/
│   └── src/
│       └── shared/           # Single source of truth for shared interfaces
│           ├── request/      # Request DTOs
│           ├── response/     # Response interfaces
│           └── enums/        # Shared enums
└── frontend/
    └── src/
```

## Current Implementation Status

### ✅ Backend - Fully Working
The backend can use the `@shared` alias without any issues:

```typescript
// backend/src/modules/any-module/any.service.ts
import { NotificationResponse } from '@shared/response';
import { AuthRequest } from '@shared/request';
import { UserLevelEnum } from '@shared/enums/user-level.enums';
```

### ⚠️ Frontend - Development Only
The `@shared` alias works during development but causes build errors. For production builds, use relative imports:

```typescript
// frontend/src/components/sidebar/Notification.vue

// ❌ Don't use this (breaks production build):
import { NotificationResponse } from '@shared/response';

// ✅ Use this instead:
import { NotificationResponse } from '../../../backend/src/shared/response';
```

## Creating Shared Interfaces

### Step 1: Create the Interface (Backend)

Create your interface in the backend's shared folder:

```typescript
// backend/src/shared/response/notification.response.ts
export interface NotificationResponse {
  id: string;
  hasRead: boolean;
  notificationData: NotificationData;
  notificationSender: NotificationSender;
}

export interface NotificationSender {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface NotificationData {
  id: string;
  content: string;
  code: {
    key: string;
    message: string;
    showDialogModule: string;
  };
  showDialogModule: string;
  showDialogId?: string;
  createdAt: {
    timeAgo: string;
    date?: Date;
  };
}
```

### Step 2: Export from Index

Add the export to the appropriate index file:

```typescript
// backend/src/shared/response/index.ts
export * from './notification.response';
```

### Step 3: Use in Backend

```typescript
// backend/src/modules/notification/notification.service.ts
import { NotificationResponse } from '@shared/response';

async getNotifications(): Promise<NotificationResponse[]> {
  // Implementation
}
```

### Step 4: Use in Frontend

Until the build issue is resolved, use relative imports:

```typescript
// frontend/src/components/NotificationList.vue
<script setup lang="ts">
import { NotificationResponse } from '../../../backend/src/shared/response';
import { ref } from 'vue';

const notifications = ref<NotificationResponse[]>([]);
</script>
```

## Best Practices

1. **Keep all shared interfaces in the backend** - Backend is the single source of truth
2. **Use descriptive suffixes** - Add `Request`, `Response`, or `Enum` to names
3. **Export from index files** - Makes imports cleaner and more maintainable
4. **Document complex interfaces** - Add JSDoc comments for clarity
5. **Version interfaces carefully** - Changes affect both frontend and backend

## Common Patterns

### Request/Response Pairs
```typescript
// backend/src/shared/request/user.request.ts
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  name?: string;
}

// backend/src/shared/response/user.response.ts
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Shared Enums
```typescript
// backend/src/shared/enums/status.enum.ts
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Usage in both frontend and backend
import { TaskStatus } from '../path/to/shared/enums/status.enum';
```

### Complex Nested Interfaces
```typescript
// backend/src/shared/response/project.response.ts
export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  team: TeamMember[];
  timeline: ProjectTimeline;
  metadata: ProjectMetadata;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface ProjectTimeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: TaskStatus;
}
```

## Benefits

1. **Type Safety**: Both frontend and backend use the same TypeScript types
2. **Single Source of Truth**: One definition used across the entire application
3. **Easier Refactoring**: Change once, updates everywhere
4. **Better Developer Experience**: IntelliSense and type checking across the stack
5. **Reduced Errors**: No more mismatched API contracts

## Future Improvements

We're working on fixing the frontend build issue with the `@shared` alias. Once resolved, frontend imports will be as clean as backend imports:

```typescript
// Future frontend usage (after build fix)
import { NotificationResponse } from '@shared/response';
```

## Troubleshooting

### Import not working in frontend?
- Check that you're using the correct relative path
- Ensure the interface is exported from the backend's index file
- Restart your IDE's TypeScript service
- Restart the development server

### Type mismatch errors?
- Ensure both frontend and backend are using the same import
- Check that you've rebuilt both projects after interface changes
- Verify the interface matches the actual API response

### Build errors?
- Frontend: Use relative imports instead of `@shared` alias
- Backend: The `@shared` alias should work without issues