# Supabase Integration Guide - Frontend-Main

Complete documentation for using Supabase in the ANTE frontend-main application, with practical examples from TaskList.vue.

## 📚 Documentation Index

| Guide | Description |
|-------|-------------|
| [01. Getting Started](./01-getting-started.md) | Environment setup, authentication flow, and basic queries |
| [02. Table Composables](./02-table-composables.md) | Data fetching patterns, filtering, pagination, and caching |
| [03. Realtime Integration](./03-realtime-integration.md) | Live updates, WebSocket subscriptions, and optimistic updates |
| [04. Component Patterns](./04-component-patterns.md) | Vue integration, data transformation, and lifecycle management |
| [05. CRUD Operations](./05-crud-operations.md) | Read-only frontend, backend writes, and store integration |
| [06. Advanced Queries](./06-advanced-queries.md) | Joins, nested relationships, and performance optimization |
| [07. Security Best Practices](./07-security-best-practices.md) | RLS policies, token management, and common pitfalls |
| [08. Troubleshooting Guide](./08-troubleshooting-guide.md) | Common issues, debug techniques, and testing strategies |

## 🚀 Quick Start

### 1. Environment Setup
```env
VITE_SUPABASE_URL=https://ofnmfmwywkhosrmycltb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
VITE_ENABLE_SUPABASE_REALTIME=true
```

### 2. Basic Query
```typescript
import { useTaskTable } from 'src/composables/supabase/useTaskTable';

const { data, loading, refetch } = useTaskTable({
  assignedToId: currentUserId,
  orderBy: { column: 'createdAt', ascending: false }
});
```

### 3. Realtime Updates
```typescript
import { useTaskRealtime } from 'src/composables/realtime/useTaskRealtime';

const { isConnected } = useTaskRealtime({ immediate: true });
```

## 📋 Common Code Snippets

### Fetch with Filters
```typescript
const { data } = useTaskTable({
  filters: [
    { column: 'boardLaneId', operator: 'neq', value: 3 },
    { column: 'priorityLevel', operator: 'gte', value: 3 }
  ],
  pageSize: 20
});
```

### Optimistic Update
```typescript
// Update UI immediately
taskStore.updateTask(taskId, { status: 'done' });

// Sync with backend
try {
  await api.patch(`/task/${taskId}`, { status: 'done' });
} catch (error) {
  // Rollback on failure
  taskStore.updateTask(taskId, { status: 'todo' });
}
```

### Data Transformation
```typescript
const convertTaskData = (task: any): Task => ({
  id: String(task.id),
  title: task.title,
  status: mapBoardLaneToStatus(task.boardLane),
  assignee: formatAssigneeName(task.assignedTo),
  priority: mapPriorityLevel(task.priorityLevel)
});
```

### Join Query
```typescript
const { data } = await supabase
  .from('Task')
  .select(`
    *,
    assignedTo:Account(firstName, lastName),
    project:Project(name),
    boardLane:BoardLane(key, name)
  `)
  .eq('companyId', companyId);
```

## 🏗️ Architecture Overview

```
Frontend-Main (Vue.js)
    ├── Components (TaskList.vue)
    │   └── Uses Composables
    ├── Composables (useTaskTable)
    │   └── Uses Supabase Service
    ├── Supabase Service (Singleton)
    │   └── Direct DB Access (Read-Only)
    └── Backend API
        └── Write Operations (Full Access)
```

## 🔑 Key Concepts

### 1. Read-Only Frontend
- Frontend reads directly from Supabase for speed
- All writes go through backend API for security
- RLS policies enforce read-only access

### 2. Singleton Service
- One Supabase client instance for entire app
- Managed session persistence
- Automatic token refresh

### 3. Composable Pattern
- Reusable data fetching logic
- Built-in caching (5-minute TTL)
- Reactive data with auto-updates

### 4. Optimistic Updates
- Immediate UI updates for better UX
- Backend sync in background
- Rollback on failure

### 5. Realtime Subscriptions
- WebSocket connections for live updates
- Automatic reconnection handling
- Event-based state management

## 🎯 Quick Reference Tables

### Filter Operators
| Operator | SQL Equivalent | Example |
|----------|---------------|---------|
| `eq` | `=` | `{ column: 'status', operator: 'eq', value: 'active' }` |
| `neq` | `!=` | `{ column: 'boardLaneId', operator: 'neq', value: 3 }` |
| `gt` | `>` | `{ column: 'priority', operator: 'gt', value: 2 }` |
| `gte` | `>=` | `{ column: 'priorityLevel', operator: 'gte', value: 3 }` |
| `lt` | `<` | `{ column: 'dueDate', operator: 'lt', value: now }` |
| `lte` | `<=` | `{ column: 'createdAt', operator: 'lte', value: date }` |
| `like` | `LIKE` | `{ column: 'title', operator: 'like', value: '%urgent%' }` |
| `ilike` | `ILIKE` | `{ column: 'description', operator: 'ilike', value: '%task%' }` |
| `is` | `IS` | `{ column: 'assignedToId', operator: 'is', value: null }` |
| `in` | `IN` | `{ column: 'boardLaneId', operator: 'in', value: [1, 2] }` |

### Realtime Events
| Event | Description | Payload |
|-------|-------------|---------|
| `INSERT` | New record created | `{ new: record, old: {} }` |
| `UPDATE` | Record updated | `{ new: updated, old: previous }` |
| `DELETE` | Record deleted | `{ new: {}, old: deleted }` |

### Common Issues & Solutions
| Issue | Solution |
|-------|----------|
| "Cannot read properties of null" | Initialize Supabase service |
| "Permission denied" | Check X-Source header and RLS |
| "PostgREST failed to parse" | Use client-side filtering for nested fields |
| "Session not available" | Ensure authenticated before subscribing |
| "Updates not received" | Enable table replication in Supabase |

## 💡 Best Practices

### ✅ DO
- Use composables for data fetching
- Implement optimistic updates
- Filter at database level when possible
- Clean up subscriptions on unmount
- Cache data appropriately
- Handle errors gracefully

### ❌ DON'T
- Expose service keys in frontend
- Write directly to Supabase from frontend
- Create multiple Supabase clients
- Forget to set X-Source header
- Skip error handling
- Leave subscriptions open

## 🔧 Development Tools

### Debug Utilities
```typescript
// Check connection
await debugSupabase.testConnection();

// Test RLS policies
await debugSupabase.testRLS('Task');

// Monitor realtime
await debugSupabase.testRealtimeTable('Task');

// List active channels
await debugSupabase.listChannels();
```

### Environment Check
```bash
# Verify setup
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check headers
curl http://localhost:3000/api/test -H "X-Source: frontend-main"
```

## 📖 Real-World Example: TaskList.vue

The TaskList component demonstrates all major Supabase patterns:

1. **Data Fetching**: Uses `useTaskTable` composable
2. **Filtering**: Dynamic filters based on view (my/all/due/done)
3. **Realtime**: Live updates with `useTaskRealtime`
4. **Optimistic Updates**: Immediate UI feedback
5. **Drag & Drop**: Bulk order updates
6. **Store Integration**: Pinia store as single source of truth
7. **Error Handling**: Graceful fallbacks and rollbacks

See [TaskList.vue](/frontends/frontend-main/src/pages/Member/Task/TaskList.vue) for complete implementation.

## 🆘 Getting Help

1. **Start Here**: [Getting Started Guide](./01-getting-started.md)
2. **Common Issues**: [Troubleshooting Guide](./08-troubleshooting-guide.md)
3. **Security Questions**: [Security Best Practices](./07-security-best-practices.md)
4. **Main Documentation**: [SUPABASE_INTEGRATION.md](../SUPABASE_INTEGRATION.md)

## 📝 Quick Checklist

Before using Supabase in your component:

- [ ] Environment variables configured
- [ ] Boot files in correct order (axios before auth)
- [ ] X-Source header set
- [ ] RLS policies allow read access
- [ ] Using appropriate composable
- [ ] Error handling implemented
- [ ] Cleanup on unmount
- [ ] Optimistic updates for writes

## 🔄 Update History

- **Latest**: Complete guide based on TaskList.vue implementation
- **Coverage**: All major Supabase patterns and real-world examples
- **Focus**: Practical, actionable documentation for developers

---

For detailed information on any topic, refer to the individual guides listed above. Each guide includes complete examples, best practices, and troubleshooting tips.