# CRUD Operations - Create, Read, Update, Delete Patterns

This guide covers the read-only frontend approach with backend API for writes, including optimistic updates and store integration.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Read Operations](#read-operations)
- [Create Operations](#create-operations)
- [Update Operations](#update-operations)
- [Delete Operations](#delete-operations)
- [Optimistic Updates Pattern](#optimistic-updates-pattern)
- [Store Integration](#store-integration)
- [Real Examples from TaskList](#real-examples-from-tasklist)

## Architecture Overview

### The Split Approach

```
┌──────────────┐           ┌──────────────┐
│   Frontend   │           │   Backend    │
├──────────────┤           ├──────────────┤
│ READ ONLY    │           │ FULL ACCESS  │
│ - Supabase   │           │ - Supabase   │
│ - RLS Policy │           │ - Service Key│
│ - Anon Key   │           │ - API Routes │
└──────────────┘           └──────────────┘
       ↓                          ↑
    READ from                  WRITE via
    Supabase                  Backend API
```

### Why This Pattern?

1. **Security**: Frontend never has write access to database
2. **Validation**: Backend validates all data before writing
3. **Business Logic**: Complex operations stay on backend
4. **Audit Trail**: Backend can log all changes
5. **Performance**: Direct reads are faster than API calls

## Read Operations

### Direct Supabase Reads

```typescript
// Read directly from Supabase (frontend)
import { useTaskTable } from 'src/composables/supabase/useTaskTable';

// Simple read with composable
const { data: tasks, loading, refetch } = useTaskTable({
  assignedToId: userId,
  orderBy: { column: 'createdAt', ascending: false }
});

// Direct query
const supabase = supabaseService.getClient();
const { data, error } = await supabase
  .from('Task')
  .select('*, assignedTo:Account(*)')
  .eq('id', taskId)
  .single();
```

### Read with Filters (TaskList Example)

```typescript
// From TaskList.vue - dynamic filtering
const taskTableConfig = computed(() => {
  const config = {
    orderBy: [
      { column: 'order', ascending: true },
      { column: 'createdAt', ascending: false }
    ],
    filters: [],
    pageSize: 5000
  };

  switch (props.filter) {
    case 'my':
      config.assignedToId = currentUserId.value;
      config.filters.push({
        column: 'boardLaneId',
        operator: 'neq',
        value: 3  // Not DONE
      });
      break;

    case 'due':
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      config.filters.push({
        column: 'dueDate',
        operator: 'lte',
        value: threeDays.toISOString()
      });
      break;

    case 'done':
      config.filters.push({
        column: 'boardLaneId',
        operator: 'eq',
        value: 3  // DONE lane
      });
      break;
  }

  return config;
});

const { data: tasks } = useTaskTable(taskTableConfig.value);
```

## Create Operations

### Backend API for Creation

```typescript
// Frontend: Create via backend API
const createTask = async (taskData: Partial<Task>) => {
  // Call backend API
  const response = await api.post('/task', taskData);

  // Backend handles:
  // - Validation
  // - Setting createdById
  // - Setting companyId
  // - Generating order value
  // - Creating in Supabase

  return response.data;
};
```

### Create with Dialog (TaskList Pattern)

```typescript
// From TaskList.vue
const showCreateDialog = ref(false);

const openCreateDialog = () => {
  showCreateDialog.value = true;
};

const handleTaskCreated = async (taskData: any) => {
  // Create via store (which calls backend)
  await taskStore.createTask(taskData);
  showCreateDialog.value = false;

  // Refetch to get new task with all relations
  await refetchTasks();
};
```

### Inline Creation (Board View)

```typescript
// From TaskList.vue - addTaskToSection
const addTaskToSection = async (section: string, title?: string) => {
  if (!title) {
    openCreateDialog();
    return;
  }

  // Prepare task data based on section
  const taskData: any = {
    title,
    description: '',
    status: 'todo',
    boardLaneId: 1,
    order: -1,  // Place at top
    assignedMode: 'OTHER'
  };

  // Apply section defaults
  if (props.filter === 'my' && currentUserId.value) {
    taskData.assignedToId = currentUserId.value;
    taskData.assignedMode = 'SELF';
  }

  // Set priority/project/status based on grouping
  if (groupingMode === 'priority' && section === 'high') {
    taskData.priorityLevel = 4;
  }

  // Create via store
  const createdTask = await taskStore.createTask(taskData);

  // Refetch for fresh data
  await refetchTasks();
};
```

## Update Operations

### Backend API Updates

```typescript
// Frontend: Update via backend
const updateTask = async (taskId: number, updates: Partial<Task>) => {
  // Call backend API
  await api.patch(`/task/${taskId}`, updates);

  // Backend handles:
  // - Validation
  // - Permission checks
  // - Setting updatedById
  // - Updating in Supabase
};
```

### Field-Level Updates (TaskList Pattern)

```typescript
// From TaskList.vue - updateTaskField
const updateTaskField = async (
  task: Task,
  field: string,
  value: any,
  extraData?: any
) => {
  const taskId = Number(task.id);

  switch (field) {
    case 'title':
    case 'description':
      // Simple field update
      taskStore.updateTask(taskId, { [field]: value });
      await taskStore.updateTaskInDB(taskId, { [field]: value });
      break;

    case 'assignedToId':
      // Complex update with related data
      if (value) {
        taskStore.updateTask(taskId, {
          assignedToId: value,
          assignee: extraData || 'Updating...',
          assignedTo: null
        });
      } else {
        taskStore.updateTask(taskId, {
          assignedToId: null,
          assignee: 'Unassigned',
          assignedTo: null
        });
      }
      await taskStore.assignTask(taskId, value, extraData);
      break;

    case 'priority':
      // Convert priority to level
      const priorityLevel = priorityStringToLevel(value);
      taskStore.updateTask(taskId, { priorityLevel, priority: value });
      await taskStore.updateTaskPriority(taskId, priorityLevel);
      break;

    case 'dueDate':
      taskStore.updateTask(taskId, { dueDate: value });
      await taskStore.updateTaskDueDate(taskId, value);
      break;
  }
};
```

### Status Updates (Board Lanes)

```typescript
// From TaskList.vue
const updateTaskStatus = async (task: Task, newStatus: string) => {
  // Map status to board lane
  let boardLaneId = 1;  // Default TODO
  switch (newStatus) {
    case 'done': boardLaneId = 3; break;
    case 'in_progress': boardLaneId = 2; break;
    case 'pending_approval': boardLaneId = 4; break;
  }

  const taskId = Number(task.id);

  // Optimistic update
  taskStore.updateTask(taskId, {
    boardLaneId,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    completedAt: newStatus === 'done' ? new Date().toISOString() : null
  });

  // Sync with backend
  try {
    await taskStore.moveTask(taskId, boardLaneId);
  } catch (error) {
    // Error handled in store with rollback
    console.error('Failed to update status:', error);
  }
};
```

### Bulk Updates (Reordering)

```typescript
// From TaskList.vue - handleReorderTasks
const handleReorderTasks = async (data: {
  sectionKey: string;
  fromIndex: number;
  toIndex: number;
  task: Task;
}) => {
  isDraggingTask.value = true;  // Prevent overwrites

  // Reorder locally
  const sectionTasks = getTasksForSection(data.sectionKey, allTasks);
  const [movedTask] = sectionTasks.splice(data.fromIndex, 1);
  sectionTasks.splice(data.toIndex, 0, movedTask);

  // Calculate new order values
  const updates: Array<{ id: number; order: number }> = [];
  sectionTasks.forEach((task, index) => {
    const newOrder = (index + 1) * 1000;
    if (task.order !== newOrder) {
      updates.push({ id: parseInt(task.id), order: newOrder });
      task.order = newOrder;
    }
  });

  // Update store immediately
  taskStore.setTasks(updatedTasks);

  // Persist to backend (don't await)
  persistTaskOrder(updates)
    .then(() => {
      isDraggingTask.value = false;
    })
    .catch(async (error) => {
      Notify.create({
        type: 'negative',
        message: 'Failed to save task order'
      });
      isDraggingTask.value = false;
      await refetchTasks();  // Rollback
    });
};
```

## Delete Operations

### Soft Delete Pattern

```typescript
// From TaskList.vue
const deleteTask = async (task: Task) => {
  try {
    // Optimistic removal from UI
    await taskStore.deleteTask(Number(task.id));

    // Backend marks as deleted (soft delete)
    // Sets isDeleted = true, doesn't actually delete
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

const restoreTask = async (task: Task) => {
  try {
    await taskStore.restoreTask(Number(task.id));
    await refetchTasks();
  } catch (error) {
    console.error('Restore failed:', error);
  }
};
```

## Optimistic Updates Pattern

### The Three-Step Process

```typescript
// 1. UPDATE UI IMMEDIATELY (Optimistic)
// 2. SYNC WITH BACKEND (Confirm)
// 3. ROLLBACK IF FAILED (Error handling)

const optimisticUpdate = async (taskId: number, updates: any) => {
  // Store original state for rollback
  const originalTask = taskStore.getTask(taskId);

  // Step 1: Update UI immediately
  taskStore.updateTask(taskId, updates);

  try {
    // Step 2: Sync with backend
    await api.patch(`/task/${taskId}`, updates);
  } catch (error) {
    // Step 3: Rollback on failure
    taskStore.updateTask(taskId, originalTask);

    Notify.create({
      type: 'negative',
      message: 'Update failed, changes reverted'
    });

    throw error;
  }
};
```

### Complex Optimistic Update

```typescript
// From TaskList - with temporary placeholder data
const assignTask = async (taskId: number, userId: string) => {
  // Optimistic update with placeholder
  taskStore.updateTask(taskId, {
    assignedToId: userId,
    assignee: 'Loading...',  // Temporary
    assignedTo: null
  });

  try {
    // Get full user data from backend
    const response = await api.post(`/task/${taskId}/assign`, { userId });

    // Update with real data
    taskStore.updateTask(taskId, {
      assignedToId: userId,
      assignee: response.data.assigneeName,
      assignedTo: response.data.assignedTo
    });
  } catch (error) {
    // Rollback
    taskStore.updateTask(taskId, {
      assignedToId: null,
      assignee: 'Unassigned',
      assignedTo: null
    });
  }
};
```

## Store Integration

### Task Store Pattern

```typescript
// src/stores/task.ts
export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [] as TaskData[],
    loading: false,
    error: null
  }),

  actions: {
    // Set all tasks
    setTasks(tasks: TaskData[]) {
      this.tasks = tasks;
    },

    // Add single task
    addTask(task: TaskData) {
      this.tasks.push(task);
    },

    // Update task
    updateTask(taskId: number, updates: Partial<TaskData>) {
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates };
      }
    },

    // Remove task
    removeTask(taskId: number) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
    },

    // API operations
    async createTask(taskData: any) {
      const response = await api.post('/task', taskData);
      this.addTask(response.data);
      return response.data;
    },

    async updateTaskInDB(taskId: number, updates: any) {
      await api.patch(`/task/${taskId}`, updates);
    },

    async deleteTask(taskId: number) {
      // Optimistic removal
      this.removeTask(taskId);

      try {
        await api.delete(`/task/${taskId}`);
      } catch (error) {
        // Rollback would refetch all tasks
        throw error;
      }
    },

    async moveTask(taskId: number, boardLaneId: number) {
      await api.post(`/task/${taskId}/move`, { boardLaneId });
    }
  }
});
```

### Component to Store to API Flow

```typescript
// Complete flow example
export default defineComponent({
  setup() {
    const taskStore = useTaskStore();

    // 1. Component calls store action
    const handleStatusChange = async (task: Task, newStatus: string) => {
      // 2. Store updates local state (optimistic)
      taskStore.updateTask(task.id, { status: newStatus });

      // 3. Store calls backend API
      await taskStore.updateTaskStatus(task.id, newStatus);

      // 4. Realtime updates sync to other clients
      // (handled by useTaskRealtime subscription)
    };

    return { handleStatusChange };
  }
});
```

## Real Examples from TaskList

### Complete CRUD Flow

```typescript
// CREATE
const handleTaskCreated = async (taskData: any) => {
  await taskStore.createTask(taskData);
  showCreateDialog.value = false;
  await refetchTasks();
};

// READ (with filters)
const { data: tasks } = useTaskTable({
  filters: buildFiltersForView(props.filter),
  orderBy: { column: 'order', ascending: true }
});

// UPDATE (optimistic)
const toggleTaskStatus = (task: Task) => {
  const newStatus = task.status === 'done' ? 'todo' : 'done';

  // Immediate UI update
  taskStore.updateTask(task.id, { status: newStatus });

  // Backend sync
  taskStore.updateTaskStatus(task.id, newStatus);
};

// DELETE (soft delete)
const deleteTask = async (task: Task) => {
  await taskStore.deleteTask(Number(task.id));
};
```

### Drag & Drop with Batch Updates

```typescript
const handleReorderTasks = async (dragData) => {
  // Prevent realtime overwrites
  isDraggingTask.value = true;

  // Calculate all position changes
  const updates = calculateNewOrder(dragData);

  // Update UI immediately
  taskStore.batchUpdateOrder(updates);

  // Persist in background
  try {
    await api.put('/task/update-order', { taskOrders: updates });
  } finally {
    isDraggingTask.value = false;
  }
};
```

## Best Practices

### 1. Always Use Optimistic Updates
```typescript
// Good: Immediate feedback
taskStore.updateTask(id, updates);
await api.patch(`/task/${id}`, updates);

// Bad: Waiting for server
await api.patch(`/task/${id}`, updates);
taskStore.updateTask(id, updates);
```

### 2. Handle Errors Gracefully
```typescript
try {
  await updateTask(id, data);
} catch (error) {
  // Rollback
  await refetchTasks();

  // Notify user
  Notify.create({
    type: 'negative',
    message: 'Update failed'
  });
}
```

### 3. Batch Operations
```typescript
// Good: Single API call
await api.put('/tasks/batch-update', { tasks: updates });

// Bad: Multiple API calls
for (const update of updates) {
  await api.patch(`/task/${update.id}`, update);
}
```

### 4. Use Appropriate Loading States
```typescript
// Field-level loading
const savingField = ref<string | null>(null);

const updateField = async (field: string, value: any) => {
  savingField.value = field;
  try {
    await updateTask(id, { [field]: value });
  } finally {
    savingField.value = null;
  }
};
```

### 5. Prevent Race Conditions
```typescript
// Use flags to prevent conflicts
const isDragging = ref(false);
const isSaving = ref(false);

watch(supabaseData, (newData) => {
  if (!isDragging.value && !isSaving.value) {
    store.setData(newData);
  }
});
```

## Summary

The CRUD pattern in frontend-main:
- **Reads** directly from Supabase for speed
- **Writes** through backend API for security
- **Updates** use optimistic patterns for responsiveness
- **Deletes** are soft deletes for data recovery
- **Store** acts as the single source of truth

This architecture provides the best balance of performance, security, and user experience.

## Next Steps

- [Advanced Queries](./06-advanced-queries.md) - Complex data fetching
- [Security Best Practices](./07-security-best-practices.md) - Secure patterns
- [Troubleshooting](./08-troubleshooting-guide.md) - Common issues