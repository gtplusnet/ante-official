# Troubleshooting Guide - Common Issues and Solutions

This guide helps you debug and resolve common Supabase integration issues in frontend-main.

## Table of Contents
- [Common Error Messages](#common-error-messages)
- [Authentication Issues](#authentication-issues)
- [Query Problems](#query-problems)
- [Realtime Issues](#realtime-issues)
- [Performance Problems](#performance-problems)
- [Debug Techniques](#debug-techniques)
- [Testing Strategies](#testing-strategies)

## Common Error Messages

### "Cannot read properties of null (reading 'getClient')"

**Cause**: Supabase service not initialized or session not set.

**Solution**:
```typescript
// Check initialization
const client = supabaseService.getClient();
if (!client) {
  console.error('Supabase client not initialized');
  // Initialize or wait for auth
  await supabaseService.initialize();
}

// Ensure session exists
const { data: session } = await supabaseService.getSession();
if (!session) {
  console.log('No active session, user needs to login');
  return;
}
```

### "PostgREST failed to parse logic tree"

**Cause**: Complex OR queries with nested fields not supported by PostgREST.

**Solution**:
```typescript
// ❌ Won't work - nested OR
.or('account.firstName.ilike.%john%,account.lastName.ilike.%john%')

// ✅ Solution 1: Client-side filtering
const { data } = await supabase
  .from('Task')
  .select('*, account:Account(firstName, lastName)');

const filtered = data.filter(item => {
  const search = 'john'.toLowerCase();
  return (
    item.account?.firstName?.toLowerCase().includes(search) ||
    item.account?.lastName?.toLowerCase().includes(search)
  );
});

// ✅ Solution 2: Database function
const { data } = await supabase
  .rpc('search_tasks_by_assignee', { search_term: 'john' });
```

### "permission denied for table Task"

**Cause**: Missing or incorrect RLS policies.

**Solution**:
```typescript
// 1. Check X-Source header is set
console.log('Headers:', api.defaults.headers.common);
// Should show: { 'X-Source': 'frontend-main', ... }

// 2. Verify boot order in quasar.config.js
boot: ['axios', 'auth']  // axios MUST be before auth

// 3. Check RLS policy in database
// Run in Supabase SQL editor:
SELECT * FROM pg_policies WHERE tablename = 'Task';

// 4. Test policy manually
SELECT current_setting('request.headers')::json->>'x-source';
// Should return: frontend-main
```

### "Initial data fetch timeout - continuing anyway"

**Cause**: Expected behavior with 5-second safety timeout in dialogs.

**Solution**:
```typescript
// This is normal in EditCreateEmployee.vue
// Data will load after timeout
// To reduce occurrences:

// 1. Optimize query
const { data } = await supabase
  .from('EmployeeData')
  .select('id, accountId, employeeCode')  // Only needed fields
  .eq('accountId', employeeId)
  .single();

// 2. Use caching
const { data, isCached } = useCache(
  employeeCache,
  () => fetchEmployeeData(employeeId),
  { ttl: CacheTTL.EMPLOYEE_DATA }
);
```

## Authentication Issues

### Session Not Persisting

**Problem**: User has to login again after page refresh.

**Solution**:
```typescript
// 1. Check localStorage
const session = localStorage.getItem('supabase.auth.token');
console.log('Stored session:', !!session);

// 2. Verify auth boot file
// src/boot/auth.ts
export default boot(async ({ store }) => {
  const authStore = store.auth;

  // Restore session on app start
  if (authStore.isAuthenticated) {
    await authStore.initializeSupabaseSession();
  }
});

// 3. Check session restoration
// src/stores/auth.ts
async initializeSupabaseSession() {
  const { data } = await supabaseService.getSession();
  if (data?.session) {
    this.supabaseSession = data.session;
    console.log('✅ Session restored');
  }
}
```

### "Session not available for realtime subscription"

**Problem**: Trying to subscribe before authentication.

**Solution**:
```typescript
// Check auth before subscribing
const subscribeToRealtime = async () => {
  // Wait for auth
  if (!authStore.isAuthenticated) {
    console.error('User not authenticated');
    return;
  }

  // Wait for Supabase session
  if (!authStore.supabaseSession) {
    console.error('Supabase session not ready');
    return;
  }

  // Now safe to subscribe
  const { isConnected } = useTaskRealtime({ immediate: true });
};

// Or use a watcher
watch(() => authStore.supabaseSession, (session) => {
  if (session) {
    subscribeToRealtime();
  }
});
```

## Query Problems

### Empty Results When Data Exists

**Check these common causes**:

```typescript
// 1. Check filters
const config = {
  filters: [
    { column: 'companyId', operator: 'eq', value: companyId }
  ]
};
console.log('Query filters:', config.filters);

// 2. Check RLS policies
// Frontend may be blocked by RLS even if data exists
const { data, error } = await supabase.from('Task').select('*');
if (error) {
  console.error('RLS Error:', error);
}

// 3. Check deleted flag
// May be filtering out soft-deleted items
const config = {
  includeDeleted: true  // Include deleted items
};

// 4. Debug raw query
const { data, error } = await supabase
  .from('Task')
  .select('*')
  .limit(1);
console.log('Raw query result:', data, error);
```

### Joins Not Working

```typescript
// 1. Check foreign key names
// ❌ Wrong
.select('*, user:User(*)')  // If FK is assignedToId, not userId

// ✅ Correct - specify the foreign key
.select('*, assignedTo:Account!Task_assignedToId_fkey(*)')

// 2. Check if relation exists
// Use left join if relation is optional
.select('*, project:Project(*)')  // May return null

// Use inner join if required
.select('*, project:Project!inner(*)')  // Filters out nulls

// 3. Debug step by step
// First try without joins
const { data: basic } = await supabase.from('Task').select('*');

// Then add one join at a time
const { data: withUser } = await supabase
  .from('Task')
  .select('*, assignedTo:Account(*)');
```

### Sorting Not Working

```typescript
// 1. Multiple order by
// ❌ Wrong - only last order applies
.order('priority', { ascending: false })
.order('createdAt', { ascending: true })

// ✅ Correct - use array in config
const config = {
  orderBy: [
    { column: 'priority', ascending: false },
    { column: 'createdAt', ascending: true }
  ]
};

// 2. Null values affecting sort
.order('dueDate', { ascending: true, nullsFirst: false })

// 3. Check column exists
console.log('Available columns:', Object.keys(data[0] || {}));
```

## Realtime Issues

### Not Receiving Updates

**Debug steps**:

```typescript
// 1. Check if realtime is enabled
console.log('Realtime enabled:', import.meta.env.VITE_ENABLE_SUPABASE_REALTIME);

// 2. Check table replication
// In Supabase dashboard: Database > Replication
// Ensure your table has replication enabled

// 3. Debug subscription
const subscription = supabase
  .channel('debug-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'Task'
  }, (payload) => {
    console.log('🔔 Realtime event:', payload);
  })
  .on('system', {}, (payload) => {
    console.log('📡 System event:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// 4. Check filters
// Too restrictive filter may exclude updates
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'Task',
  filter: 'id=eq.99999'  // Won't receive any updates
}, handler)
```

### Duplicate Updates

```typescript
// Prevent multiple subscriptions
let subscription: RealtimeChannel | null = null;

const subscribe = async () => {
  // Cleanup existing
  if (subscription) {
    await subscription.unsubscribe();
  }

  // Create new subscription
  subscription = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', config, handler)
    .subscribe();
};

// Track subscriptions
onMounted(() => subscribe());
onUnmounted(() => subscription?.unsubscribe());
```

### Connection Drops

```typescript
// Implement reconnection logic
const { isConnected, reconnect } = useRealtimeSubscription('Task', {
  callbacks: {
    onConnect: () => console.log('✅ Connected'),
    onDisconnect: () => {
      console.log('❌ Disconnected, attempting reconnect...');
      setTimeout(() => reconnect(), 5000);
    }
  }
});

// Monitor connection
watch(isConnected, (connected) => {
  if (!connected) {
    Notify.create({
      message: 'Live updates disconnected',
      color: 'warning'
    });
  }
});
```

## Performance Problems

### Slow Initial Load

```typescript
// 1. Optimize select query
// ❌ Fetching everything
.select('*')

// ✅ Only needed fields
.select('id, title, status, assignedTo:Account(firstName)')

// 2. Implement pagination
const { data } = useTaskTable({
  pageSize: 20,  // Not 5000
  useCursor: true  // For large datasets
});

// 3. Use caching
import { clearTableCache } from 'src/composables/supabase/useTaskTable';

// Clear only when necessary
onActivated(() => {
  if (needsRefresh) {
    clearTableCache('Task');
  }
});

// 4. Progressive loading
const loadTasks = async () => {
  // Load critical data first
  const { data: urgent } = await supabase
    .from('Task')
    .select('id, title')
    .gte('priorityLevel', 4)
    .limit(10);

  displayUrgentTasks(urgent);

  // Load rest in background
  loadRemainingTasks();
};
```

### Memory Leaks

```typescript
// 1. Clean up watchers
const stopWatcher = watch(data, handler);
onUnmounted(() => stopWatcher());

// 2. Unsubscribe from realtime
const subscription = useTaskRealtime();
onUnmounted(() => subscription.unsubscribe());

// 3. Clear large data arrays
onUnmounted(() => {
  largeDataArray.value = [];
  cacheMap.clear();
});

// 4. Use shallowRef for large objects
import { shallowRef } from 'vue';
const largeData = shallowRef([]);  // Not reactive deeply
```

## Debug Techniques

### Enable Debug Mode

```typescript
// 1. Supabase debug mode
if (process.env.NODE_ENV === 'development') {
  const client = supabaseService.getClient();

  // Log all queries
  client.on('*', (event) => {
    console.log('Supabase event:', event);
  });
}

// 2. Add debug logging to composables
const useTaskTable = (options) => {
  console.group('useTaskTable');
  console.log('Options:', options);
  console.log('Filters:', options.filters);
  console.groupEnd();

  // ... rest of composable
};

// 3. Network tab debugging
// Check Supabase API calls in browser DevTools
// Look for /rest/v1/ requests
```

### Query Inspection

```typescript
// Build query step by step
let query = supabase.from('Task').select('*');

console.log('Base query created');

if (filters.assignedToId) {
  query = query.eq('assignedToId', filters.assignedToId);
  console.log('Added assignedToId filter:', filters.assignedToId);
}

if (filters.status) {
  query = query.eq('status', filters.status);
  console.log('Added status filter:', filters.status);
}

const { data, error } = await query;
console.log('Query result:', { data, error });
```

### RLS Policy Testing

```sql
-- Test RLS policies in SQL Editor
-- Set the headers that frontend sends
SET LOCAL request.headers = '{"x-source": "frontend-main"}';

-- Set user context
SET LOCAL auth.uid = 'user-uuid-here';

-- Now test your query
SELECT * FROM "Task" WHERE assignedToId = 'user-uuid-here';

-- Check what policies are active
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'Task';
```

## Testing Strategies

### Unit Testing Composables

```typescript
// test/supabase/useTaskTable.test.ts
import { describe, it, expect, vi } from 'vitest';
import { useTaskTable } from 'src/composables/supabase/useTaskTable';

// Mock Supabase
vi.mock('src/services/supabase', () => ({
  default: {
    getClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({
                data: mockTasks,
                error: null
              })
            })
          })
        })
      })
    })
  }
}));

describe('useTaskTable', () => {
  it('should fetch tasks with filters', async () => {
    const { data, loading } = useTaskTable({
      assignedToId: 'user123'
    });

    expect(loading.value).toBe(true);

    await nextTick();

    expect(data.value).toHaveLength(mockTasks.length);
    expect(loading.value).toBe(false);
  });
});
```

### Integration Testing

```typescript
// test/integration/task-flow.test.ts
import { mount } from '@vue/test-utils';
import TaskList from 'src/pages/Member/Task/TaskList.vue';

describe('Task List Integration', () => {
  it('should load and display tasks', async () => {
    const wrapper = mount(TaskList, {
      props: { filter: 'my' }
    });

    // Wait for data load
    await wrapper.vm.$nextTick();
    await new Promise(r => setTimeout(r, 1000));

    // Check tasks displayed
    const tasks = wrapper.findAll('.task-item');
    expect(tasks.length).toBeGreaterThan(0);
  });
});
```

### Debug Utilities

```typescript
// src/utils/supabase-debug.ts
export const debugSupabase = {
  async testConnection() {
    const client = supabaseService.getClient();
    const { data, error } = await client.from('Task').select('count');
    console.log('Connection test:', { data, error });
    return !error;
  },

  async testRLS(table: string) {
    const client = supabaseService.getClient();
    const { data, error } = await client.from(table).select('*').limit(1);

    if (error?.message.includes('permission denied')) {
      console.error(`❌ RLS blocking access to ${table}`);
      return false;
    }

    console.log(`✅ RLS allows access to ${table}`);
    return true;
  },

  async listChannels() {
    const client = supabaseService.getClient();
    const channels = client.getChannels();
    console.log('Active channels:', channels);
    return channels;
  },

  async testRealtimeTable(table: string) {
    const client = supabaseService.getClient();

    return new Promise((resolve) => {
      const channel = client
        .channel(`test-${table}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table
        }, (payload) => {
          console.log(`✅ Realtime working for ${table}:`, payload);
          channel.unsubscribe();
          resolve(true);
        })
        .subscribe((status) => {
          console.log(`Subscription status for ${table}:`, status);
        });

      // Timeout after 10 seconds
      setTimeout(() => {
        console.error(`❌ Realtime timeout for ${table}`);
        channel.unsubscribe();
        resolve(false);
      }, 10000);
    });
  }
};

// Usage in console
window.debugSupabase = debugSupabase;
```

## Common Fixes Checklist

### Setup Issues
- [ ] Environment variables set correctly
- [ ] Boot files in correct order (axios before auth)
- [ ] X-Source header configured
- [ ] Supabase session initialized

### Query Issues
- [ ] RLS policies allow read access
- [ ] Foreign key names correct in joins
- [ ] Filters not too restrictive
- [ ] Using correct Supabase client

### Realtime Issues
- [ ] Table replication enabled
- [ ] Session available before subscribing
- [ ] Not creating duplicate subscriptions
- [ ] Cleaning up on unmount

### Performance Issues
- [ ] Not fetching unnecessary data
- [ ] Using appropriate pagination
- [ ] Caching where appropriate
- [ ] Cleaning up resources

## Need More Help?

1. **Check browser console** for detailed error messages
2. **Review Network tab** for API responses
3. **Test in Supabase dashboard** SQL editor
4. **Enable debug mode** in development
5. **Check the main guide** at `/docs/SUPABASE_INTEGRATION.md`

## Next Steps

- [Getting Started](./01-getting-started.md) - Review basic setup
- [Security Best Practices](./07-security-best-practices.md) - Ensure secure implementation
- [Component Patterns](./04-component-patterns.md) - Best practices