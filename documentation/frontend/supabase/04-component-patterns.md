# Component Patterns - Vue Integration with Supabase

This guide covers best practices for integrating Supabase in Vue components, using TaskList.vue as the primary example.

## Table of Contents
- [Component Architecture](#component-architecture)
- [Data Flow Pattern](#data-flow-pattern)
- [Loading States & Error Handling](#loading-states--error-handling)
- [Data Transformation](#data-transformation)
- [Reactive Updates](#reactive-updates)
- [Component Lifecycle](#component-lifecycle)
- [Real TaskList Implementation](#real-tasklist-implementation)

## Component Architecture

### The Three-Layer Pattern

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Component │ ──> │  Composable │ ──> │   Supabase  │
│  (TaskList) │     │(useTaskTable)│     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       ↓                    ↓                    ↓
   UI Logic           Data Logic          Database Access
   Presentation       Transformation      Direct Queries
   User Events        Caching             Realtime
```

### Basic Component Setup

```vue
<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useTaskTable } from 'src/composables/supabase/useTaskTable';
import { useTaskRealtime } from 'src/composables/realtime/useTaskRealtime';
import { useTaskStore } from 'src/stores/task';

export default defineComponent({
  name: 'TaskList',
  props: {
    filter: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // Store integration
    const taskStore = useTaskStore();
    const { tasks: storeTasks } = storeToRefs(taskStore);

    // Supabase composables
    const { data, loading, refetch } = useTaskTable();
    const { isConnected } = useTaskRealtime();

    // Component state
    const localLoading = ref(false);

    return {
      tasks: storeTasks,
      loading,
      refetch
    };
  }
});
</script>
```

## Data Flow Pattern

### From Database to UI

```typescript
// TaskList.vue data flow
export default defineComponent({
  setup(props) {
    // 1. FETCH: Get data from Supabase
    const { data: supabaseTasks } = useTaskTable({
      filters: buildFilters(props.filter)
    });

    // 2. STORE: Sync to Pinia store
    watch(supabaseTasks, (newTasks) => {
      if (newTasks) {
        taskStore.setTasks(newTasks);
      }
    });

    // 3. TRANSFORM: Convert for UI
    const filteredTasks = computed(() => {
      return storeTasks.value
        .map(convertTaskData)
        .filter(Boolean)
        .sort(sortByOrder);
    });

    // 4. RENDER: Display in template
    return { tasks: filteredTasks };
  }
});
```

### Complete Data Pipeline

```typescript
// Step 1: Configure data fetching
const taskTableConfig = computed(() => ({
  orderBy: { column: 'order', ascending: true },
  pageSize: 5000,
  filters: getFiltersForView(props.filter),
  autoFetch: true
}));

// Step 2: Fetch with composable
const {
  data: supabaseTasks,
  loading,
  error,
  refetch
} = useTaskTable(taskTableConfig.value);

// Step 3: Transform data structure
const convertTaskData = (task: any): Task => ({
  id: String(task.id),
  title: task.title,
  status: mapBoardLaneToStatus(task.boardLane),
  priority: mapPriorityLevel(task.priorityLevel),
  assignee: formatAssigneeName(task.assignedTo),
  dueDate: task.dueDate,
  order: task.order || 0
});

// Step 4: Apply business logic
const filteredTasks = computed(() => {
  const converted = supabaseTasks.value.map(convertTaskData);

  // Apply view-specific filtering
  switch (props.filter) {
    case 'my':
      return converted.filter(t => t.assignee === currentUser);
    case 'overdue':
      return converted.filter(t => isOverdue(t.dueDate));
    default:
      return converted;
  }
});
```

## Loading States & Error Handling

### Three-State Pattern

```vue
<template>
  <div class="task-list-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <q-spinner-dots size="40px" color="primary" />
      <p>Loading tasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <q-icon name="error" size="48px" color="negative" />
      <p>{{ error.message }}</p>
      <q-btn @click="retry" label="Retry" />
    </div>

    <!-- Success State -->
    <div v-else-if="tasks.length > 0" class="task-list">
      <task-item
        v-for="task in tasks"
        :key="task.id"
        :task="task"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <q-icon name="inbox" size="48px" color="grey" />
      <p>No tasks found</p>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const { data, loading, error, refetch } = useTaskTable();

    const retry = async () => {
      await refetch();
    };

    return {
      tasks: data,
      loading,
      error,
      retry
    };
  }
};
</script>
```

### Progressive Loading

```typescript
// Show cached data while refreshing
const {
  data,
  loading,
  isRefreshing,  // True when fetching with cached data
  isCached       // True if showing cached data
} = useTaskTable();

// Template
<template>
  <div>
    <!-- Show refresh indicator if cached -->
    <q-linear-progress v-if="isRefreshing" indeterminate />

    <!-- Always show data if available -->
    <task-list :tasks="data" :class="{ 'opacity-50': isRefreshing }" />
  </div>
</template>
```

## Data Transformation

### From TaskList.vue - Complete Example

```typescript
const convertTaskData = (task: any): Task => {
  // Handle missing data
  if (!task) return null;

  // Priority mapping
  let priority: 'verylow' | 'low' | 'medium' | 'high' | 'urgent';
  const priorityValue = typeof task.priorityLevel === 'object'
    ? task.priorityLevel?.key
    : task.priorityLevel;

  if (priorityValue >= 4) priority = 'urgent';
  else if (priorityValue === 3) priority = 'high';
  else if (priorityValue === 2) priority = 'medium';
  else if (priorityValue === 1) priority = 'low';
  else priority = 'verylow';

  // Status mapping from board lane
  let status = 'todo';
  const laneKey = task.boardLane?.key;
  if (laneKey === 'DONE') status = 'done';
  else if (laneKey === 'IN_PROGRESS') status = 'in_progress';
  else if (laneKey === 'PENDING_APPROVAL') status = 'pending_approval';

  // Assignee formatting
  let assigneeName = '';
  if (task.assignee) {
    assigneeName = task.assignee;
  } else if (task.assignedTo) {
    if (typeof task.assignedTo === 'object') {
      const { firstName, lastName, username } = task.assignedTo;
      assigneeName = `${firstName || ''} ${lastName || ''}`.trim() || username || '';
    }
  }

  return {
    id: String(task.id),
    title: task.title || '',
    description: task.description || '',
    status,
    priority,
    priorityLevel: task.priorityLevel || 0,
    assignee: assigneeName,
    assignedToId: task.assignedToId,
    creator: formatCreator(task.createdBy),
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    completedAt: status === 'done' ? task.updatedAt : undefined,
    project: task.project?.name,
    projectId: task.projectId,
    boardLaneId: task.boardLaneId,
    order: task.order || 0
  };
};
```

### Computed Property Patterns

```typescript
// Group tasks by different criteria
const tasksByStatus = computed(() => {
  const grouped: Record<string, Task[]> = {};
  filteredTasks.value.forEach(task => {
    const status = task.status || 'Unknown';
    if (!grouped[status]) grouped[status] = [];
    grouped[status].push(task);
  });
  return grouped;
});

const overdueTasks = computed(() => {
  const now = new Date();
  return filteredTasks.value.filter(task => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    return due < now && task.status !== 'done';
  });
});

const taskStats = computed(() => ({
  total: filteredTasks.value.length,
  completed: filteredTasks.value.filter(t => t.status === 'done').length,
  overdue: overdueTasks.value.length,
  highPriority: filteredTasks.value.filter(t => t.priority === 'high' || t.priority === 'urgent').length
}));
```

## Reactive Updates

### Watch Pattern for Store Sync

```typescript
// Sync Supabase data to store
const isDraggingTask = ref(false);  // Flag to prevent overwrites

watch(supabaseTasks, (newTasks) => {
  // Don't overwrite during drag operations
  if (newTasks && !isDraggingTask.value) {
    taskStore.setTasks(newTasks);
  }
}, { immediate: true });
```

### Optimistic Updates with Rollback

```typescript
const updateTaskField = async (task: Task, field: string, value: any) => {
  const taskId = Number(task.id);
  const originalValue = task[field];

  // Optimistic update
  taskStore.updateTask(taskId, { [field]: value });

  try {
    // Sync with backend
    await api.patch(`/task/${taskId}`, { [field]: value });
  } catch (error) {
    // Rollback on failure
    taskStore.updateTask(taskId, { [field]: originalValue });

    Notify.create({
      type: 'negative',
      message: `Failed to update ${field}`
    });
  }
};
```

### Debounced Updates

```typescript
import { debounce } from 'quasar';

// Debounce search to reduce API calls
const searchTerm = ref('');
const debouncedSearch = debounce((value: string) => {
  tableComposable.setSearch(value);
}, 300);

watch(searchTerm, debouncedSearch);
```

## Component Lifecycle

### Initialization Pattern

```typescript
export default defineComponent({
  setup() {
    const loading = ref(true);
    const error = ref(null);

    // Initialize on mount
    onMounted(async () => {
      try {
        // Load initial data
        await loadTasks();

        // Start realtime subscription
        await subscribeToUpdates();

        // Load user preferences
        taskStore.loadCustomSections();
      } catch (err) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    });

    // Refresh on route activation (keep-alive)
    onActivated(async () => {
      clearTableCache('Task');
      await refetchTasks();
    });

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromUpdates();
    });

    return { loading, error };
  }
});
```

### Cache Management

```typescript
import { clearTableCache } from 'src/composables/supabase/useTaskTable';

// Clear cache on important events
onActivated(() => {
  // Clear when returning to page
  clearTableCache('Task');
});

watch(() => props.filter, () => {
  // Clear when filter changes
  clearTableCache('Task');
});

// After mutations
const handleTaskCreated = async (taskData) => {
  await taskStore.createTask(taskData);
  clearTableCache('Task');
  await refetchTasks();
};
```

## Real TaskList Implementation

### Complete Setup Function

```typescript
// Simplified version of TaskList.vue setup
export default defineComponent({
  name: 'TaskList',
  props: {
    filter: { type: String, required: true }
  },
  setup(props) {
    // Stores and composables
    const taskStore = useTaskStore();
    const authStore = useAuthStore();
    const { tasks: storeTasks } = storeToRefs(taskStore);

    // Current user context
    const currentUserId = computed(() => authStore.accountInformation?.id);
    const currentCompanyId = computed(() => authStore.accountInformation?.company?.id);

    // Loading state
    const loading = ref(false);

    // Configure table based on filter
    const taskTableConfig = computed(() => {
      const config = {
        orderBy: [
          { column: 'order', ascending: true },
          { column: 'createdAt', ascending: false }
        ],
        pageSize: 5000,
        autoFetch: true,
        filters: []
      };

      // Add company filter
      if (currentCompanyId.value) {
        config.companyId = currentCompanyId.value;
      }

      // Apply view-specific filters
      switch (props.filter) {
        case 'my':
          config.assignedToId = currentUserId.value;
          config.filters.push({
            column: 'boardLaneId',
            operator: 'neq',
            value: 3  // Exclude DONE
          });
          break;
        // ... other filters
      }

      return config;
    });

    // Fetch data
    const {
      data: supabaseTasks,
      loading: supabaseLoading,
      refetch: refetchTasks
    } = useTaskTable(taskTableConfig.value);

    // Set up realtime
    const { isConnected } = useTaskRealtime({ immediate: true });

    // Transform and filter tasks
    const filteredTasks = computed(() => {
      return storeTasks.value
        .map(convertTaskData)
        .filter(task => task !== null)
        .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    });

    // Sync Supabase to store
    watch(supabaseTasks, (newTasks) => {
      if (newTasks) {
        taskStore.setTasks(newTasks);
      }
    }, { immediate: true });

    // Watch loading state
    watch(supabaseLoading, (newLoading) => {
      loading.value = newLoading;
    }, { immediate: true });

    // Event handlers
    const updateTaskStatus = async (task, newStatus) => {
      const boardLaneId = statusToBoardLane(newStatus);
      const taskId = Number(task.id);

      // Optimistic update
      taskStore.updateTask(taskId, { boardLaneId, status: newStatus });

      try {
        await taskStore.moveTask(taskId, boardLaneId);
      } catch (error) {
        console.error('Failed to update:', error);
      }
    };

    // Lifecycle
    onMounted(() => {
      taskStore.loadCustomSections();
    });

    onActivated(() => {
      clearTableCache('Task');
      refetchTasks();
    });

    return {
      loading,
      filteredTasks,
      updateTaskStatus,
      refetchTasks
    };
  }
});
```

## Best Practices Summary

### 1. Separation of Concerns
- **Components**: UI logic and presentation
- **Composables**: Data fetching and transformation
- **Stores**: State management and business logic
- **Services**: Direct Supabase access

### 2. Error Boundaries
```vue
<error-boundary>
  <task-list />
  <template #error="{ error }">
    <error-display :error="error" />
  </template>
</error-boundary>
```

### 3. Loading States
- Show cached data immediately
- Indicate background refreshing
- Handle empty states gracefully

### 4. Performance
- Use computed properties for derived data
- Debounce user inputs
- Clear cache strategically
- Implement virtual scrolling for large lists

### 5. Type Safety
```typescript
// Define interfaces for all data
interface Task {
  id: string;
  title: string;
  // ... full typing
}

// Type composable returns
const { data, loading } = useTaskTable() as {
  data: Ref<Task[]>;
  loading: Ref<boolean>;
};
```

## Next Steps

- [CRUD Operations](./05-crud-operations.md) - Complete data management
- [Advanced Queries](./06-advanced-queries.md) - Complex data fetching
- [Security Best Practices](./07-security-best-practices.md) - Secure your app