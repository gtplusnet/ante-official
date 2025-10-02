# Table Composables - Working with Supabase Data

This guide covers how to use table composables for efficient data fetching, filtering, pagination, and caching.

## Table of Contents
- [Basic Usage](#basic-usage)
- [useSupabaseTable - The Foundation](#usesupabasetable---the-foundation)
- [Domain-Specific Composables](#domain-specific-composables)
- [Filtering and Searching](#filtering-and-searching)
- [Pagination Strategies](#pagination-strategies)
- [Caching Mechanisms](#caching-mechanisms)
- [Real Examples from TaskList](#real-examples-from-tasklist)

## Basic Usage

### Quick Start with useTaskTable

```typescript
import { useTaskTable } from 'src/composables/supabase/useTaskTable';

// Simple usage - fetch all tasks
const { data, loading, error, refetch } = useTaskTable();

// With filters - only my incomplete tasks
const { data: myTasks } = useTaskTable({
  assignedToId: currentUserId,
  filters: [
    { column: 'boardLaneId', operator: 'neq', value: 3 } // Not DONE
  ]
});
```

## useSupabaseTable - The Foundation

All domain composables build on `useSupabaseTable`:

### Configuration Options

```typescript
interface UseSupabaseTableOptions {
  table: string;                      // Table name
  select?: string;                    // Fields and relations to fetch
  filters?: FilterConfig[];           // Initial filters
  orderBy?: OrderConfig | OrderConfig[]; // Sorting
  pageSize?: number;                  // Records per page (default: 10)
  searchColumn?: string;              // Column for search
  searchValue?: Ref<string> | string; // Search term
  autoFetch?: boolean;                // Fetch on mount (default: true)
  useCursor?: boolean;                // Use cursor pagination
  orSearchColumns?: string[];         // Multiple search columns
}
```

### Basic Implementation

```typescript
import { useSupabaseTable } from 'src/composables/supabase/useSupabaseTable';

const tableComposable = useSupabaseTable({
  table: 'Task',
  select: `
    *,
    assignedTo:Account!Task_assignedToId_fkey(firstName, lastName),
    project:Project(name)
  `,
  filters: [
    { column: 'isDeleted', operator: 'eq', value: false }
  ],
  orderBy: { column: 'createdAt', ascending: false },
  pageSize: 20
});

// Reactive properties
const tasks = tableComposable.data;      // Ref<Task[]>
const isLoading = tableComposable.loading; // Ref<boolean>
const hasError = tableComposable.error;   // Ref<Error | null>

// Methods
await tableComposable.refetch();         // Refresh data
await tableComposable.nextPage();        // Pagination
tableComposable.setSearch('urgent');     // Search
```

## Domain-Specific Composables

### useTaskTable - Specialized for Tasks

From `src/composables/supabase/useTaskTable.ts`:

```typescript
export function useTaskTable(options: UseTaskTableOptions = {}) {
  const {
    assignedToId,
    projectId,
    boardLaneId,
    companyId,
    includeDeleted = false,
    orderBy = [
      { column: 'order', ascending: true },        // Primary sort
      { column: 'createdAt', ascending: false }    // Secondary sort
    ],
  } = options;

  // Build filters automatically
  const filters = [];
  if (!includeDeleted) {
    filters.push({ column: 'isDeleted', operator: 'eq', value: false });
  }
  if (assignedToId) {
    filters.push({ column: 'assignedToId', operator: 'eq', value: assignedToId });
  }

  // Use base composable with Task-specific config
  const tableComposable = useSupabaseTable({
    table: 'Task',
    select: TASK_SELECT_QUERY, // Includes all relations
    filters,
    orderBy,
    pageSize: 50,
    autoFetch: true
  });

  // Add Task-specific computed properties
  const tasksByStatus = computed(() => {
    // Group tasks by board lane
  });

  const overdueTasks = computed(() => {
    // Filter overdue tasks
  });

  return {
    ...tableComposable,
    tasksByStatus,
    overdueTasks,
    // Task-specific methods
    filterByAssignee,
    filterByProject
  };
}
```

### Real Usage in TaskList.vue

```typescript
// From TaskList.vue setup()
const taskTableConfig = computed(() => {
  const config = {
    orderBy: [
      { column: 'order', ascending: true },
      { column: 'createdAt', ascending: false }
    ],
    pageSize: 5000,  // Load all for drag-drop
    includeDeleted: false,
    autoFetch: true,
    filters: []
  };

  // Apply filter based on route
  switch (props.filter) {
    case 'my':
      config.assignedToId = currentUserId.value;
      config.filters.push({
        column: 'boardLaneId',
        operator: 'neq',
        value: 3  // Exclude DONE
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
  }

  return config;
});

const { data: supabaseTasks, loading, refetch } = useTaskTable(taskTableConfig.value);
```

## Filtering and Searching

### Filter Types

```typescript
interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';
  value: any;
}
```

### Common Filter Patterns

```typescript
// 1. Simple equality
{ column: 'status', operator: 'eq', value: 'active' }

// 2. Null checks
{ column: 'assignedToId', operator: 'is', value: null }

// 3. Text search (case-insensitive)
{ column: 'title', operator: 'ilike', value: '%urgent%' }

// 4. Date ranges
{ column: 'dueDate', operator: 'gte', value: startDate }
{ column: 'dueDate', operator: 'lte', value: endDate }

// 5. Multiple values
{ column: 'boardLaneId', operator: 'in', value: [1, 2] }
```

### Dynamic Filtering

```typescript
const composable = useTaskTable({ /* initial config */ });

// Add filter dynamically
composable.addFilter({
  column: 'priorityLevel',
  operator: 'gte',
  value: 3
});

// Clear all filters
composable.clearFilters();

// Replace filters
composable.updateFilters([
  { column: 'status', operator: 'eq', value: 'pending' }
]);
```

### Search Strategies

#### Server-Side Search (Simple Columns)
```typescript
const { data } = useSupabaseTable({
  table: 'Task',
  searchColumn: 'title',
  searchValue: ref('urgent')  // Reactive search
});
```

#### Client-Side Search (Complex/Nested)
```typescript
// For nested fields or complex searches
const searchTerm = ref('');
const filteredTasks = computed(() => {
  if (!searchTerm.value) return tasks.value;

  return tasks.value.filter(task => {
    const term = searchTerm.value.toLowerCase();
    return (
      task.title?.toLowerCase().includes(term) ||
      task.assignedTo?.firstName?.toLowerCase().includes(term) ||
      task.assignedTo?.lastName?.toLowerCase().includes(term)
    );
  });
});
```

## Pagination Strategies

### Offset-Based Pagination (Default)

Best for: Small to medium datasets, random access

```typescript
const composable = useSupabaseTable({
  table: 'Task',
  pageSize: 20,
  useCursor: false  // Default
});

// Navigation
await composable.nextPage();
await composable.previousPage();
await composable.goToPage(5);

// Access pagination state
console.log(composable.currentPage.value);  // 1
console.log(composable.totalPages.value);   // 10
console.log(composable.hasNextPage.value);  // true
```

### Cursor-Based Pagination

Best for: Large datasets, real-time data, infinite scroll

```typescript
const composable = useSupabaseTable({
  table: 'ActivityLog',
  pageSize: 50,
  useCursor: true,
  orderBy: { column: 'createdAt', ascending: false }
});

// Only forward navigation
await composable.nextPage();  // Uses cursor
// previousPage not available with cursor
```

### Load All Pattern (for Drag & Drop)

```typescript
// TaskList.vue approach - load all for reordering
const { data: allTasks } = useTaskTable({
  pageSize: 5000,  // Large number to get all
  orderBy: { column: 'order', ascending: true }
});
```

## Caching Mechanisms

### Built-in 5-Minute Cache

Composables automatically cache results:

```typescript
// Cache key based on query parameters
const cacheKey = `${table}_${page}_${filters}_${search}`;

// TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
```

### Manual Cache Control

```typescript
import { clearTableCache } from 'src/composables/supabase/useTaskTable';

// Clear specific table cache
clearTableCache('Task');

// Force refresh (bypasses cache)
await composable.refetch();
```

### Cache on Route Changes

From TaskList.vue:

```typescript
import { onActivated } from 'vue';
import { clearTableCache } from 'src/composables/supabase/useTaskTable';

// Clear cache when returning to page
onActivated(async () => {
  clearTableCache('Task');
  await refetchTasks();
});
```

## Real Examples from TaskList

### 1. Data Transformation

```typescript
// Convert Supabase data to UI format
const convertTaskData = (task: any): Task => {
  // Map priority levels
  let priority: 'low' | 'medium' | 'high' | 'urgent';
  if (task.priorityLevel >= 4) priority = 'urgent';
  else if (task.priorityLevel >= 3) priority = 'high';
  else if (task.priorityLevel >= 2) priority = 'medium';
  else priority = 'low';

  // Map board lane to status
  let status = 'todo';
  const laneKey = task.boardLane?.key;
  if (laneKey === 'DONE') status = 'done';
  else if (laneKey === 'IN_PROGRESS') status = 'in_progress';

  // Format assignee name
  const assigneeName = task.assignedTo ?
    `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim() :
    'Unassigned';

  return {
    id: String(task.id),
    title: task.title,
    status,
    priority,
    assignee: assigneeName,
    dueDate: task.dueDate,
    order: task.order || 0
  };
};
```

### 2. Reactive Filtering

```typescript
const filteredTasks = computed(() => {
  const convertedTasks = storeTasks.value
    .map(convertTaskData)
    .filter(task => task !== null)
    .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));

  return convertedTasks;
});
```

### 3. Watch for Updates

```typescript
// Watch Supabase data and update store
watch(supabaseTasks, (newTasks) => {
  if (newTasks && !isDraggingTask.value) {
    taskStore.setTasks(newTasks);
  }
}, { immediate: true });
```

## Best Practices

### 1. Use Computed Properties for Derived Data

```typescript
const tasksByPriority = computed(() => {
  const grouped = { High: [], Medium: [], Low: [] };
  tasks.value.forEach(task => {
    if (task.priorityLevel >= 4) grouped.High.push(task);
    else if (task.priorityLevel >= 2) grouped.Medium.push(task);
    else grouped.Low.push(task);
  });
  return grouped;
});
```

### 2. Handle Loading States

```typescript
<template>
  <div v-if="loading" class="text-center q-pa-lg">
    <q-spinner-dots size="40px" color="primary" />
  </div>
  <div v-else-if="error" class="text-negative">
    Error: {{ error.message }}
  </div>
  <div v-else>
    <!-- Show data -->
  </div>
</template>
```

### 3. Optimize Select Queries

```typescript
// Only select needed fields and relations
const { data } = useSupabaseTable({
  table: 'Task',
  select: `
    id,
    title,
    boardLaneId,
    assignedTo:Account!Task_assignedToId_fkey(firstName, lastName)
  `  // Don't use * if you don't need all fields
});
```

### 4. Debounce Search Input

```typescript
import { debounce } from 'quasar';

const searchTerm = ref('');
const debouncedSearch = debounce((value) => {
  composable.setSearch(value);
}, 300);

watch(searchTerm, debouncedSearch);
```

## Performance Tips

1. **Use appropriate page sizes** - 20-50 for lists, 5000 for drag-drop
2. **Clear cache strategically** - On route changes, after mutations
3. **Filter at database level** when possible
4. **Use client-side filtering** only for complex/nested searches
5. **Implement virtual scrolling** for large lists
6. **Batch updates** to reduce re-renders

## Next Steps

- [Realtime Integration](./03-realtime-integration.md) - Add live updates
- [Component Patterns](./04-component-patterns.md) - Vue integration best practices
- [Advanced Queries](./06-advanced-queries.md) - Complex data fetching