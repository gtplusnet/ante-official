# Realtime Integration - Live Updates with Supabase

This guide covers implementing realtime features for instant updates across all connected clients.

## Table of Contents
- [Understanding Realtime](#understanding-realtime)
- [Basic Setup](#basic-setup)
- [useTaskRealtime Pattern](#usetaskrealtime-pattern)
- [Event Handling](#event-handling)
- [Optimistic Updates](#optimistic-updates)
- [Real Example from TaskList](#real-example-from-tasklist)
- [Performance Considerations](#performance-considerations)

## Understanding Realtime

### How Supabase Realtime Works

1. **WebSocket Connection** - Persistent connection to Supabase
2. **PostgreSQL Replication** - Database changes trigger events
3. **Event Broadcasting** - Changes sent to subscribed clients
4. **Local State Updates** - Update UI without API calls

### When to Use Realtime

✅ **Good Use Cases:**
- Live task updates in team boards
- Notification systems
- Chat/messaging features
- Live dashboards
- Collaborative editing

❌ **Avoid For:**
- High-frequency updates (>10/second)
- Large payload data
- Sensitive information
- One-time data fetches

## Basic Setup

### Enable Realtime in Environment

```env
# .env file
VITE_ENABLE_SUPABASE_REALTIME=true
```

### Simple Subscription

```typescript
import supabaseService from 'src/services/supabase';

const supabase = supabaseService.getClient();

// Subscribe to table changes
const subscription = supabase
  .channel('task-changes')
  .on('postgres_changes', {
    event: '*',  // or 'INSERT' | 'UPDATE' | 'DELETE'
    schema: 'public',
    table: 'Task',
    filter: 'assignedToId=eq.user123'  // Optional filter
  }, (payload) => {
    console.log('Change received!', payload);
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

## useTaskRealtime Pattern

### The Composable Implementation

From `src/composables/realtime/useTaskRealtime.ts`:

```typescript
export function useTaskRealtime(options: UseTaskRealtimeOptions = {}) {
  const { immediate = true, projectId, assigneeId } = options;

  const taskStore = useTaskStore();
  const lastEventTimestamp = ref<string | null>(null);

  // Build filters for subscription
  const buildFilter = () => {
    const filters: string[] = [];
    if (projectId) filters.push(`projectId=eq.${projectId}`);
    if (assigneeId) filters.push(`assignedToId=eq.${assigneeId}`);
    return filters.join(',');
  };

  // Use generic realtime subscription
  const { isConnected, subscribe, unsubscribe } = useRealtimeSubscription('Task', {
    immediate: false,
    filter: buildFilter(),
    callbacks: {
      onInsert: (payload) => {
        const newTask = payload.new as TaskData;
        taskStore.addTask(newTask);
        lastEventTimestamp.value = new Date().toISOString();
      },
      onUpdate: (payload) => {
        const updatedTask = payload.new as TaskData;
        taskStore.updateTask(updatedTask.id, updatedTask);
        lastEventTimestamp.value = new Date().toISOString();
      },
      onDelete: (payload) => {
        const deletedTask = payload.old as TaskData;
        taskStore.removeTask(deletedTask.id);
        lastEventTimestamp.value = new Date().toISOString();
      }
    }
  });

  // Auto-subscribe on mount
  onMounted(async () => {
    if (immediate) {
      await subscribe();
    }
  });

  // Cleanup on unmount
  onUnmounted(async () => {
    await unsubscribe();
  });

  return { isConnected, lastEventTimestamp, subscribe, unsubscribe };
}
```

### Using in TaskList.vue

```typescript
// Set up realtime subscription
const { isConnected: realtimeConnected } = useTaskRealtime({
  immediate: true  // Subscribe on mount
});

console.log('Realtime status:', realtimeConnected.value);
```

## Event Handling

### Event Types and Payloads

```typescript
// INSERT event
{
  eventType: 'INSERT',
  new: { id: 1, title: 'New Task', ... },  // New record
  old: {},                                  // Empty for INSERT
  commit_timestamp: '2024-01-01T00:00:00Z'
}

// UPDATE event
{
  eventType: 'UPDATE',
  new: { id: 1, title: 'Updated Task', ... },  // After update
  old: { id: 1, title: 'Old Task', ... },      // Before update
  commit_timestamp: '2024-01-01T00:00:00Z'
}

// DELETE event
{
  eventType: 'DELETE',
  new: {},                                  // Empty for DELETE
  old: { id: 1, title: 'Deleted Task', ... }, // Deleted record
  commit_timestamp: '2024-01-01T00:00:00Z'
}
```

### Detecting Specific Changes

```typescript
// Enhanced update handler from useTaskRealtime
const handleUpdate = (payload: any) => {
  const newTask = payload.new as TaskData;
  const oldTask = payload.old as TaskData;

  // Detect board lane changes
  if (oldTask.boardLaneId !== newTask.boardLaneId) {
    console.log(`Task moved from lane ${oldTask.boardLaneId} to ${newTask.boardLaneId}`);
    // Trigger lane count update
  }

  // Detect assignment changes
  if (oldTask.assignedToId !== newTask.assignedToId) {
    console.log(`Task reassigned to ${newTask.assignedToId}`);
    // Show notification
  }

  // Detect priority changes
  if (oldTask.priorityLevel !== newTask.priorityLevel) {
    console.log(`Priority changed to ${newTask.priorityLevel}`);
    // Update priority indicators
  }

  // Update store
  taskStore.updateTask(newTask.id, newTask);
};
```

## Optimistic Updates

### The Pattern

Optimistic updates provide instant feedback by updating the UI before the server confirms:

```typescript
// From TaskList.vue - updateTaskStatus
const updateTaskStatus = async (task: Task, newStatus: string) => {
  // Map status to boardLaneId
  const boardLaneId = statusToBoardLane(newStatus);
  const taskId = Number(task.id);

  // 1. OPTIMISTIC UPDATE - Immediate UI change
  taskStore.updateTask(taskId, {
    boardLaneId,
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  // 2. SYNC WITH BACKEND - Confirm change
  try {
    await taskStore.moveTask(taskId, boardLaneId);
  } catch (error) {
    // 3. ROLLBACK ON ERROR - Revert if failed
    taskStore.updateTask(taskId, {
      boardLaneId: task.boardLaneId,  // Original value
      status: task.status,
      updatedAt: task.updatedAt
    });
    console.error('Failed to update:', error);
  }
};
```

### Full Implementation Example

```typescript
// updateTaskField from TaskList.vue
const updateTaskField = async (task: Task, field: string, value: any, extraData?: any) => {
  const taskId = Number(task.id);

  // Optimistic update patterns for different fields
  switch (field) {
    case 'title':
      // Simple field - update immediately
      taskStore.updateTask(taskId, { title: value });
      await taskStore.updateTaskInDB(taskId, { title: value });
      break;

    case 'assignedToId':
      // Complex update with related data
      if (value) {
        // Update with temporary assignee name
        taskStore.updateTask(taskId, {
          assignedToId: value,
          assignee: extraData || 'Updating...',
          assignedTo: null  // Clear relation
        });
      } else {
        // Unassign task
        taskStore.updateTask(taskId, {
          assignedToId: null,
          assignee: 'Unassigned',
          assignedTo: null
        });
      }
      // Sync with backend
      await taskStore.assignTask(taskId, value, extraData);
      break;

    case 'priority':
      // Convert and update
      const priorityLevel = priorityToLevel(value);
      taskStore.updateTask(taskId, { priorityLevel, priority: value });
      await taskStore.updateTaskPriority(taskId, priorityLevel);
      break;
  }
};
```

## Real Example from TaskList

### Complete Setup with Store Integration

```typescript
// TaskList.vue - Full realtime + store pattern
export default defineComponent({
  setup(props) {
    const taskStore = useTaskStore();
    const { tasks: storeTasks } = storeToRefs(taskStore);

    // Configure Supabase table
    const taskTableConfig = computed(() => ({
      orderBy: [
        { column: 'order', ascending: true },
        { column: 'createdAt', ascending: false }
      ],
      pageSize: 5000,
      autoFetch: true,
      filters: buildFiltersForView(props.filter)
    }));

    // Fetch data with Supabase
    const {
      data: supabaseTasks,
      loading: supabaseLoading,
      refetch: refetchTasks
    } = useTaskTable(taskTableConfig.value);

    // Set up realtime
    const { isConnected } = useTaskRealtime({
      immediate: true
    });

    // Sync Supabase data to store (unless dragging)
    const isDraggingTask = ref(false);
    watch(supabaseTasks, (newTasks) => {
      if (newTasks && !isDraggingTask.value) {
        taskStore.setTasks(newTasks);
      }
    }, { immediate: true });

    // Handle drag & drop with optimistic updates
    const handleReorderTasks = async (data) => {
      isDraggingTask.value = true;  // Prevent overwrites

      // Reorder locally
      const reorderedTasks = reorderTasksLocally(data);
      taskStore.setTasks(reorderedTasks);

      // Persist to backend
      try {
        await persistTaskOrder(reorderedTasks);
        isDraggingTask.value = false;
      } catch (error) {
        isDraggingTask.value = false;
        await refetchTasks();  // Rollback by refetching
      }
    };

    return {
      tasks: storeTasks,
      loading: supabaseLoading,
      handleReorderTasks,
      refetchTasks
    };
  }
});
```

## Performance Considerations

### 1. Subscription Management

```typescript
// BAD: Multiple subscriptions to same table
const sub1 = subscribe('Task', { filter: 'status=eq.todo' });
const sub2 = subscribe('Task', { filter: 'status=eq.done' });

// GOOD: Single subscription, filter in handler
const sub = subscribe('Task', {
  onUpdate: (payload) => {
    const task = payload.new;
    if (task.status === 'todo') handleTodo(task);
    if (task.status === 'done') handleDone(task);
  }
});
```

### 2. Prevent Duplicate Updates

```typescript
// Track update timestamps to prevent loops
const lastUpdateTime = ref<number>(0);

const handleRealtimeUpdate = (payload) => {
  const updateTime = new Date(payload.commit_timestamp).getTime();

  // Ignore if we just made this update
  if (updateTime - lastUpdateTime.value < 1000) {
    return;
  }

  // Process update
  updateLocalState(payload.new);
};
```

### 3. Debounce Rapid Updates

```typescript
import { debounce } from 'quasar';

// Debounce updates to prevent UI thrashing
const debouncedUpdate = debounce((updates: TaskData[]) => {
  taskStore.batchUpdate(updates);
}, 100);

// Collect updates
const pendingUpdates: TaskData[] = [];
const handleUpdate = (payload) => {
  pendingUpdates.push(payload.new);
  debouncedUpdate(pendingUpdates);
};
```

### 4. Clean Up Subscriptions

```typescript
// Always unsubscribe on unmount
onUnmounted(async () => {
  await subscription.unsubscribe();
});

// Or use composable that handles it
const { subscribe, unsubscribe } = useTaskRealtime();
// Automatic cleanup on unmount
```

## Advanced Patterns

### Selective Subscription

```typescript
// Only subscribe to relevant changes
const { isConnected } = useTaskRealtime({
  immediate: true,
  assigneeId: currentUserId.value,  // Only my tasks
  filter: 'boardLaneId=neq.3'       // Exclude DONE tasks
});
```

### Channel-Based Updates

```typescript
// Create named channels for different features
const taskChannel = supabase
  .channel('task-board')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'Task'
  }, handleTaskChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'BoardLane'
  }, handleLaneChange)
  .subscribe();
```

### Presence (Who's Online)

```typescript
const presenceChannel = supabase.channel('presence');

// Track online users
presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    console.log('Online users:', state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        userId: currentUserId,
        online_at: new Date().toISOString()
      });
    }
  });
```

## Best Practices

1. **Subscribe once, filter in handler** - Reduces connections
2. **Use optimistic updates** - Better UX
3. **Implement rollback logic** - Handle failures gracefully
4. **Debounce rapid updates** - Prevent UI thrashing
5. **Clean up subscriptions** - Prevent memory leaks
6. **Filter at database level** - Use RLS and filters
7. **Handle reconnection** - Network issues happen

## Common Issues

### "Session not available for realtime"
```typescript
// Ensure authenticated before subscribing
if (!authStore.supabaseSession) {
  console.error('No session for realtime');
  return;
}
```

### Updates Not Received
```typescript
// Check table replication is enabled
// In Supabase dashboard: Database > Replication
// Enable replication for your table
```

### Too Many Subscriptions
```typescript
// Monitor active subscriptions
console.log('Active channels:', supabase.getChannels());

// Remove all subscriptions
await supabase.removeAllChannels();
```

## Next Steps

- [Component Patterns](./04-component-patterns.md) - Vue integration patterns
- [CRUD Operations](./05-crud-operations.md) - Complete data management
- [Troubleshooting](./08-troubleshooting-guide.md) - Debug realtime issues