# Advanced Queries - Complex Data Fetching with Supabase

This guide covers advanced query patterns including joins, nested relationships, and performance optimization.

## Table of Contents
- [Joining Tables](#joining-tables)
- [Nested Relationships](#nested-relationships)
- [Filtering Strategies](#filtering-strategies)
- [Complex Search Patterns](#complex-search-patterns)
- [Performance Optimization](#performance-optimization)
- [Real Examples from TaskList](#real-examples-from-tasklist)

## Joining Tables

### Basic Join Pattern

```typescript
// Simple foreign key join
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    assignedTo:Account(firstName, lastName)
  `);

// Result:
// {
//   id: 1,
//   title: "Task Title",
//   assignedTo: { firstName: "John", lastName: "Doe" }
// }
```

### Multiple Joins (TaskList Example)

```typescript
// From useTaskTable.ts
const TASK_SELECT_QUERY = `
  *,
  assignedTo:Account!Task_assignedToId_fkey(
    id,
    firstName,
    lastName,
    username,
    image
  ),
  createdBy:Account!Task_createdById_fkey(
    id,
    firstName,
    lastName,
    username
  ),
  updatedBy:Account!Task_updatedById_fkey(
    id,
    firstName,
    lastName,
    username
  ),
  project:Project(
    id,
    name,
    description
  ),
  company:Company(
    id,
    companyName
  ),
  boardLane:BoardLane(
    id,
    name,
    key,
    order
  )
`;
```

### Join with Aliases

```typescript
// Different aliases for same table
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    assignedTo:Account!Task_assignedToId_fkey(firstName, lastName),
    createdBy:Account!Task_createdById_fkey(firstName, lastName)
  `);

// Note: !TableName_columnName_fkey syntax for specific foreign keys
```

### Inner Joins (Required Relations)

```typescript
// Use !inner to require the relation exists
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    assignedTo:Account!inner(firstName, lastName)
  `)
  .not('assignedToId', 'is', null);

// Only returns tasks WITH an assigned user
```

## Nested Relationships

### Multi-Level Nesting

```typescript
// Fetch tasks with nested project and client data
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    project:Project(
      id,
      name,
      client:Client(
        id,
        companyName,
        industry
      )
    ),
    assignedTo:Account(
      firstName,
      lastName,
      employeeData:EmployeeData(
        employeeCode,
        department,
        position
      )
    )
  `);
```

### Many-to-Many Relationships

```typescript
// Tasks with tags (through junction table)
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    task_tags:TaskTag(
      tag:Tag(
        id,
        name,
        color
      )
    )
  `);

// Transform nested structure
const tasksWithTags = data.map(task => ({
  ...task,
  tags: task.task_tags.map(tt => tt.tag)
}));
```

### Reverse Relations

```typescript
// Get user with their tasks
const { data } = await supabase
  .from('Account')
  .select(`
    *,
    assignedTasks:Task!Task_assignedToId_fkey(
      id,
      title,
      status,
      boardLane:BoardLane(name)
    )
  `)
  .eq('id', userId);
```

## Filtering Strategies

### Server-Side vs Client-Side

```typescript
// From TaskList - Decision logic
const useClientSearch = computed(() => {
  const searchCol = searchConfig?.column;
  // Use client-side for nested fields
  return searchCol && (
    searchCol.includes('firstName') ||
    searchCol.includes('lastName') ||
    searchCol.includes('.')  // Any nested field
  );
});

// Server-side (simple columns)
if (!useClientSearch.value) {
  query = query.ilike('title', `%${searchTerm}%`);
}

// Client-side (complex/nested)
const filtered = computed(() => {
  if (!searchTerm.value) return data.value;

  return data.value.filter(item => {
    const term = searchTerm.value.toLowerCase();
    return (
      item.assignedTo?.firstName?.toLowerCase().includes(term) ||
      item.assignedTo?.lastName?.toLowerCase().includes(term)
    );
  });
});
```

### Complex Filter Combinations

```typescript
// Multiple conditions with OR/AND
const { data } = await supabase
  .from('Task')
  .select('*')
  .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  .gte('priorityLevel', 3)
  .in('boardLaneId', [1, 2])
  .is('isDeleted', false);
```

### Dynamic Filter Building

```typescript
// From TaskList - Build filters based on view
const buildFilters = (viewType: string) => {
  const filters: FilterConfig[] = [];

  // Always exclude deleted
  filters.push({ column: 'isDeleted', operator: 'eq', value: false });

  switch (viewType) {
    case 'my':
      filters.push({
        column: 'assignedToId',
        operator: 'eq',
        value: currentUserId
      });
      filters.push({
        column: 'boardLaneId',
        operator: 'neq',
        value: 3  // Not DONE
      });
      break;

    case 'due':
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      filters.push({
        column: 'dueDate',
        operator: 'lte',
        value: deadline.toISOString()
      });
      break;

    case 'overdue':
      filters.push({
        column: 'dueDate',
        operator: 'lt',
        value: new Date().toISOString()
      });
      filters.push({
        column: 'boardLaneId',
        operator: 'neq',
        value: 3  // Not completed
      });
      break;
  }

  return filters;
};
```

## Complex Search Patterns

### Full-Text Search

```typescript
// Using PostgreSQL full-text search
const { data } = await supabase
  .from('Task')
  .select('*')
  .textSearch('title', searchTerm, {
    type: 'websearch',
    config: 'english'
  });
```

### Multi-Column Search

```typescript
// Search across multiple columns
const searchAcrossColumns = async (term: string) => {
  // Option 1: OR query (limited to same table)
  const { data: option1 } = await supabase
    .from('Task')
    .select('*')
    .or(`
      title.ilike.%${term}%,
      description.ilike.%${term}%,
      tags.cs.{${term}}
    `);

  // Option 2: Multiple queries combined
  const searches = await Promise.all([
    supabase.from('Task').select('*').ilike('title', `%${term}%`),
    supabase.from('Task').select('*').ilike('description', `%${term}%`),
    supabase.from('Task').select('*').contains('tags', [term])
  ]);

  // Deduplicate results
  const allResults = searches.flatMap(s => s.data || []);
  const unique = Array.from(new Map(
    allResults.map(item => [item.id, item])
  ).values());

  return unique;
};
```

### Fuzzy Search Implementation

```typescript
// Client-side fuzzy search for better UX
import Fuse from 'fuse.js';

const fuzzySearch = (items: Task[], searchTerm: string) => {
  const fuse = new Fuse(items, {
    keys: [
      'title',
      'description',
      'assignedTo.firstName',
      'assignedTo.lastName',
      'project.name'
    ],
    threshold: 0.3,  // Adjust for sensitivity
    includeScore: true
  });

  return fuse.search(searchTerm).map(result => result.item);
};

// Use with Supabase data
const { data: allTasks } = useTaskTable({ pageSize: 1000 });
const searchResults = computed(() => {
  if (!searchTerm.value) return allTasks.value;
  return fuzzySearch(allTasks.value, searchTerm.value);
});
```

## Performance Optimization

### Select Only Required Fields

```typescript
// Bad: Fetching everything
const { data } = await supabase
  .from('Task')
  .select('*');  // Gets all columns

// Good: Specific fields
const { data } = await supabase
  .from('Task')
  .select(`
    id,
    title,
    boardLaneId,
    assignedTo:Account(firstName, lastName)
  `);
```

### Pagination Strategies

```typescript
// Offset pagination (for UI with page numbers)
const fetchPage = async (page: number, pageSize: number = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from('Task')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('createdAt', { ascending: false });

  return {
    data,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

// Cursor pagination (for infinite scroll)
const fetchNextPage = async (cursor: string | null) => {
  let query = supabase
    .from('Task')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt('createdAt', cursor);
  }

  const { data } = await query;
  const nextCursor = data?.[data.length - 1]?.createdAt;

  return { data, nextCursor };
};
```

### Batch Loading Pattern

```typescript
// Load all data for drag-drop (TaskList approach)
const loadAllForDragDrop = async () => {
  // Large page size to get everything
  const { data } = await supabase
    .from('Task')
    .select('*')
    .order('order', { ascending: true })
    .limit(5000);  // Reasonable upper limit

  return data;
};

// Progressive loading for large datasets
const progressiveLoad = async () => {
  const chunks = [];
  let hasMore = true;
  let offset = 0;
  const chunkSize = 100;

  while (hasMore) {
    const { data } = await supabase
      .from('Task')
      .select('*')
      .range(offset, offset + chunkSize - 1);

    if (data?.length) {
      chunks.push(...data);
      offset += chunkSize;
      hasMore = data.length === chunkSize;
    } else {
      hasMore = false;
    }
  }

  return chunks;
};
```

### Query Optimization Tips

```typescript
// 1. Use indexes effectively
// Ensure columns used in filters have indexes

// 2. Limit depth of nested queries
// Bad: Too deep
.select('*, project(*, client(*, industry(*, sector(*))))')

// Good: Flatten when possible
.select('*, project(name, clientName:client(companyName))')

// 3. Use RPC for complex queries
const { data } = await supabase
  .rpc('get_tasks_with_stats', {
    user_id: userId,
    include_completed: false
  });

// 4. Cache frequently accessed data
const cachedProjects = ref<Project[]>([]);
const getProjects = async (force = false) => {
  if (!force && cachedProjects.value.length) {
    return cachedProjects.value;
  }
  const { data } = await supabase.from('Project').select('*');
  cachedProjects.value = data || [];
  return cachedProjects.value;
};
```

## Real Examples from TaskList

### Complete Query Configuration

```typescript
// From TaskList.vue - Full configuration
const taskTableConfig = computed(() => {
  const config: any = {
    orderBy: [
      { column: 'order', ascending: true },       // Primary
      { column: 'createdAt', ascending: false }   // Secondary
    ],
    pageSize: 5000,
    includeDeleted: false,
    autoFetch: true,
    filters: []
  };

  // Company filter
  if (currentCompanyId.value) {
    config.companyId = currentCompanyId.value;
  }

  // View-specific filters
  switch (props.filter) {
    case 'my':
      config.assignedToId = currentUserId.value;
      config.filters.push({
        column: 'boardLaneId',
        operator: 'neq',
        value: 3
      });
      config.filters.push({
        column: 'taskType',
        operator: 'neq',
        value: 'APPROVAL'
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
```

### Data Grouping

```typescript
// Group tasks by various criteria
const tasksByPriority = computed(() => {
  const grouped: Record<string, TaskData[]> = {
    'Urgent': [],
    'High': [],
    'Medium': [],
    'Low': [],
    'None': []
  };

  tasks.value.forEach(task => {
    if (task.priorityLevel >= 4) grouped['Urgent'].push(task);
    else if (task.priorityLevel === 3) grouped['High'].push(task);
    else if (task.priorityLevel === 2) grouped['Medium'].push(task);
    else if (task.priorityLevel === 1) grouped['Low'].push(task);
    else grouped['None'].push(task);
  });

  return grouped;
});
```

### Optimized Reordering Query

```typescript
// Batch update for drag-drop
const persistTaskOrder = async (updates: Array<{ id: number; order: number }>) => {
  // Single API call for multiple updates
  await api.put('/task/update-order', {
    taskOrders: updates,
    viewType: props.filterType,
    groupingMode: taskSearchStore.groupingMode,
    groupingValue: taskSearchStore.currentGroupingValue
  });

  // Backend uses bulk update:
  // UPDATE Task SET order = CASE
  //   WHEN id = 1 THEN 1000
  //   WHEN id = 2 THEN 2000
  //   ...
  // END
  // WHERE id IN (1, 2, ...)
};
```

## Best Practices

### 1. Query Planning
```typescript
// Plan your data needs upfront
const REQUIRED_FIELDS = {
  list: 'id, title, status, assignedTo(firstName)',
  detail: '*, assignedTo(*), project(*), comments(*)',
  board: 'id, title, order, boardLaneId'
};
```

### 2. Avoid N+1 Queries
```typescript
// Bad: Multiple queries
const tasks = await getTasks();
for (const task of tasks) {
  task.assignee = await getUser(task.assignedToId);
}

// Good: Single query with join
const tasks = await supabase
  .from('Task')
  .select('*, assignedTo:Account(*)');
```

### 3. Handle Large Results
```typescript
// Stream large datasets
const streamLargeDataset = async function* () {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await fetchPage(page++);
    if (data?.length) {
      yield data;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
};

// Usage
for await (const batch of streamLargeDataset()) {
  processBatch(batch);
}
```

### 4. Use Database Functions
```sql
-- Create a database function for complex logic
CREATE OR REPLACE FUNCTION get_task_statistics(user_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total', (SELECT COUNT(*) FROM Task WHERE assignedToId = user_id),
    'completed', (SELECT COUNT(*) FROM Task WHERE assignedToId = user_id AND boardLaneId = 3),
    'overdue', (SELECT COUNT(*) FROM Task WHERE assignedToId = user_id AND dueDate < NOW() AND boardLaneId != 3)
  );
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Call from frontend
const { data } = await supabase
  .rpc('get_task_statistics', { user_id: userId });
```

## Next Steps

- [Security Best Practices](./07-security-best-practices.md) - RLS and security
- [Troubleshooting](./08-troubleshooting-guide.md) - Debug complex queries
- [Table Composables](./02-table-composables.md) - Reusable query patterns