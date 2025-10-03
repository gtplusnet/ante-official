# Supabase Integration Guide for Frontend-Main

This comprehensive guide covers how to properly integrate and use Supabase in the frontend-main application, including real-world examples from the HRIS system and notification service.

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Configuration & Setup](#configuration--setup)
- [Core Services](#core-services)
- [Table Composables](#table-composables)
- [Component Integration](#component-integration)
- [Realtime Integration](#realtime-integration)
- [Security & RLS](#security--rls)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)
- [Troubleshooting](#troubleshooting)

## Overview & Architecture

### Integration Architecture

The frontend-main application uses Supabase as a direct database access layer with the following architecture:

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Vue Components │    │  Composables │    │ Supabase Service │
│                 │    │              │    │                 │
│ - SupabaseGTable│────│useSupabaseTable│───│  supabaseService│
│ - HRIS Pages    │    │useHRISEmployees│   │                 │
│ - Notifications │    │useNotification │   │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                    │
                                           ┌─────────────────┐
                                           │ Supabase Client │
                                           │                 │
                                           │ - Authentication│
                                           │ - Database      │
                                           │ - Realtime      │
                                           └─────────────────┘
```

### Key Principles

1. **Singleton Service**: One `supabaseService` instance across the app
2. **Read-Only Access**: Frontend only reads data, backend handles writes via API
3. **Session Management**: Automatic session persistence and refresh
4. **RLS Security**: Row Level Security policies with X-Source header
5. **Composable Pattern**: Reusable composables for different data entities

## Configuration & Setup

### Environment Variables

Add these variables to your `.env` file:

```env
# Supabase Configuration (Hosted on supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PROJECT_ID=your_project_id

# Vite-accessible configuration (VITE_ prefix required for frontend access)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# NEVER put service role key in frontend - it's a security risk!
# SUPABASE_SERVICE_KEY should only be in backend

# Realtime configuration
VITE_ENABLE_SUPABASE_REALTIME=true
```

### Boot Configuration

Ensure the boot sequence in `quasar.config.js` includes:

```javascript
boot: ['sentry', 'axios', 'auth', 'multi-account', ...]
```

The `auth` boot file must come after `axios` to ensure proper header setup.

## Core Services

### SupabaseService

The main service class located at `src/services/supabase.js`:

```javascript
import supabaseService from 'src/services/supabase';

// Initialize client
const client = supabaseService.getClient();

// Session management
await supabaseService.setSession(accessToken, refreshToken);
const { data: session } = await supabaseService.getSession();

// Authentication events
supabaseService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

#### Key Methods

- `initialize()` - Initialize the Supabase client
- `setSession(accessToken, refreshToken)` - Set session from backend tokens
- `getSession()` - Get current session
- `getClient()` - Get client instance for database operations
- `onAuthStateChange(callback)` - Listen to auth state changes
- `signOut()` - Clear session and sign out

### Authentication Flow

1. **Login via Backend API** - User authenticates with custom backend
2. **Receive Tokens** - Backend returns Supabase access/refresh tokens
3. **Set Supabase Session** - Frontend sets session using tokens
4. **Session Persistence** - Session stored in localStorage
5. **Auto Refresh** - Tokens automatically refreshed by Supabase client

```typescript
// In auth store
async initializeSupabaseSession() {
  try {
    const { data } = await supabaseService.getSession();
    
    if (data?.session) {
      this.supabaseSession = data.session;
      this.supabaseInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}
```

## Table Composables

### useSupabaseTable

The generic table composable for database operations:

```typescript
import { useSupabaseTable } from 'src/composables/supabase/useSupabaseTable';

const tableComposable = useSupabaseTable({
  table: 'EmployeeData',
  select: `
    *,
    account:Account!inner (
      firstName,
      lastName,
      email
    )
  `,
  filters: [
    { column: 'isActive', operator: 'eq', value: true }
  ],
  orderBy: { column: 'createdAt', ascending: false },
  pageSize: 10,
  searchColumn: 'employeeCode',
  searchValue: searchTerm
});

// Access reactive data
const data = tableComposable.data;
const loading = tableComposable.loading;
const error = tableComposable.error;

// Pagination methods
await tableComposable.nextPage();
await tableComposable.previousPage();
await tableComposable.goToPage(3);

// Search and filters
tableComposable.setSearch('john');
tableComposable.addFilter({
  column: 'department',
  operator: 'eq',
  value: 'IT'
});
```

#### Configuration Options

```typescript
interface UseSupabaseTableOptions {
  table: string;                    // Table name
  select?: string;                  // Select query with joins
  filters?: FilterConfig[];         // Initial filters
  orderBy?: OrderConfig;           // Sorting configuration
  pageSize?: number;               // Records per page (default: 10)
  searchColumn?: string;           // Column to search
  searchValue?: Ref<string> | string; // Search value
  useCursor?: boolean;             // Use cursor-based pagination
  orSearchColumns?: string[];      // Columns for OR search
}
```

#### Caching Strategy

The composable includes a 5-minute TTL cache:

```typescript
// Automatic caching based on query parameters
const cacheKey = `${table}_${currentPage}_${pageSize}_${filters}_${search}`;

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
```

### Domain-Specific Composables

#### useHRISEmployees

Specialized composable for HRIS employee data:

```typescript
import { useHRISEmployees } from 'src/composables/supabase/useHRISEmployees';

const hrisComposable = useHRISEmployees('active', {
  column: ref('fullName'),
  value: searchTerm
});

// Transformed data with nested relationships
const employees = hrisComposable.data; // Already formatted for UI

// HRIS-specific methods
await hrisComposable.updateEmployee(accountId, updates);
await hrisComposable.deleteEmployee(accountId);
await hrisComposable.restoreEmployee(accountId);
```

#### Available Tab Types

```typescript
type TabType = 'active' | 'inactive' | 'separated' | 'not_yet';
```

- `active` - Active employees (isActive = true)
- `inactive` - Inactive employees (isActive = false)
- `separated` - Employees with end dates
- `not_yet` - Users without EmployeeData records

#### Data Transformation

The useHRISEmployees composable automatically transforms database records:

```typescript
// Raw database record
{
  id: "uuid",
  accountId: "uuid", 
  employeeCode: "EMP001",
  account: {
    firstName: "John",
    lastName: "Doe"
  }
}

// Transformed for UI
{
  id: "uuid",
  accountId: "uuid",
  employeeCode: "EMP001",
  accountDetails: {
    firstName: "John",
    lastName: "Doe",
    image: "/images/person01.webp"
  },
  contractDetails: {
    startDate: { dateFull: "01/15/2024" }
  }
}
```

## Component Integration

### SupabaseGTable Component

The main table component that integrates with Supabase composables:

```vue
<template>
  <supabase-g-table 
    :isRowActionEnabled="true" 
    tableKey="employeeListTable" 
    supabaseTab="active"
    ref="table">
    
    <!-- Custom column rendering -->
    <template v-slot:accountDetails="props">
      <div @click="editEmployee(props)">
        {{ props.data.accountDetails.firstName }} 
        {{ props.data.accountDetails.lastName }}
      </div>
    </template>

    <!-- Row actions -->
    <template v-slot:row-actions="props">
      <g-button icon="more_horiz" variant="text">
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div @click="editEmployee(props)">Edit</div>
            <div @click="deleteEmployee(props)">Delete</div>
          </div>
        </q-menu>
      </g-button>
    </template>
  </supabase-g-table>
</template>

<script>
import SupabaseGTable from 'src/components/shared/display/SupabaseGTable.vue';

export default {
  components: { SupabaseGTable },
  methods: {
    editEmployee(props) {
      const employeeId = props.data.accountDetails.id;
      // Open edit dialog with ID
    },
    
    refreshTable() {
      this.$refs.table.refetch();
    }
  }
}
</script>
```

#### Props

- `tableKey` - References table definition in `src/references/table.reference`
- `supabaseTab` - Tab type for domain composables
- `isRowActionEnabled` - Show actions column
- `isClickableRow` - Enable row click events
- `noFilter` - Hide filter row

#### Table Reference Configuration

```typescript
// src/references/table/employeeListTable.table.reference.ts
export default {
  columns: [
    { key: 'employeeCode', label: 'Employee Code', class: 'text-left' },
    { 
      key: 'accountDetails', 
      label: 'Employee Name', 
      slot: 'accountDetails',
      class: 'text-left' 
    }
  ],
  search: [
    { key: 'fullName', label: 'Search by Name', column: 'fullName' },
    { key: 'employeeCode', label: 'Employee Code', column: 'employeeCode' }
  ],
  filter: [
    {
      key: 'branchId',
      label: 'Branch',
      selectBoxAPI: 'select-box/branch-list'
    }
  ]
}
```

## Realtime Integration

### Base Realtime Service

The `SupabaseRealtimeService` provides a foundation for realtime subscriptions:

```javascript
import { SupabaseRealtimeService } from 'src/services/supabase/base/SupabaseRealtimeService';

class CustomRealtimeService extends SupabaseRealtimeService {
  getConfig() {
    return {
      table: 'YourTable',
      schema: 'public',
      filter: 'userId=eq.' + this.userId,
      events: ['INSERT', 'UPDATE', 'DELETE']
    };
  }
  
  transformPayload(eventType, payload) {
    // Transform raw database payload
    return payload;
  }
}

// Usage
const service = new CustomRealtimeService();
service.setCallbacks({
  onInsert: (data) => console.log('New record:', data),
  onUpdate: (data) => console.log('Updated:', data),
  onDelete: (data) => console.log('Deleted:', data)
});

await service.subscribe();
```

### Notification Realtime Service

Real-world implementation for notifications:

```javascript
// src/services/supabase/notifications/NotificationRealtimeService.js
import { NotificationRealtimeService } from 'src/services/supabase/notifications/NotificationRealtimeService';

const notificationService = new NotificationRealtimeService();

// Set up callbacks
notificationService.setCallbacks({
  onInsert: async (payload) => {
    // Fetch full notification data
    const fullData = await fetchNotification(payload.notificationId);
    addToNotificationList(fullData);
  },
  onUpdate: (payload) => {
    updateNotificationInList(payload.data);
  },
  onDelete: (payload) => {
    removeFromNotificationList(payload.notificationId);
  }
});

await notificationService.subscribe();
```

### Notification Realtime Composable

```typescript
// src/composables/realtime/useNotificationRealtime.ts
import { useNotificationRealtime } from 'src/composables/realtime/useNotificationRealtime';

const {
  notifications,
  unreadCount,
  isConnected,
  subscribe,
  fetchAllNotifications,
  markAsRead
} = useNotificationRealtime();

// Subscribe to realtime updates
await subscribe();

// Fetch initial data
await fetchAllNotifications();

// Mark notification as read
await markAsRead(notificationId);
```

## Security & RLS

### X-Source Header

The frontend identifies itself to RLS policies via the X-Source header:

```typescript
// src/boot/axios.ts
api.defaults.headers.common['X-Source'] = 'frontend-main';
```

### RLS Policy Structure

Policies are defined in `/backend/src/security/database-rules.sql`:

```sql
-- Frontend read-only access policy
CREATE POLICY "frontend_read_only" ON "EmployeeData"
FOR SELECT TO anon USING (
  current_setting('request.headers')::json->>'x-source' = 'frontend-main'
);

-- Backend full access policy  
CREATE POLICY "backend_full_access" ON "EmployeeData"
FOR ALL TO service_role USING (true);
```

### Security Best Practices

1. **Never expose service role key** in frontend environment variables
2. **Use anon key only** for frontend authentication
3. **Rely on RLS policies** for data access control
4. **Validate permissions** on backend for all write operations
5. **Filter sensitive data** in select queries

```typescript
// ❌ Wrong: Exposing service key
VITE_SUPABASE_SERVICE_KEY=your_service_key

// ✅ Correct: Only anon key for frontend
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const tableComposable = useSupabaseTable({
  table: 'EmployeeData',
  // ... other options
});

// Watch for errors
watch(tableComposable.error, (error) => {
  if (error) {
    console.error('Database error:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load data'
    });
  }
});
```

### 2. Memory Management

Clean up subscriptions and watchers:

```typescript
// In component setup or composable
onBeforeUnmount(() => {
  if (realtimeService) {
    realtimeService.unsubscribe();
  }
});
```

### 3. Optimistic Updates

For better UX, update local state immediately:

```typescript
const updateEmployee = async (id: string, updates: any) => {
  // Optimistic update
  updateLocalEmployee(id, updates);
  
  try {
    // API call to backend
    await api.patch(`/employees/${id}`, updates);
  } catch (error) {
    // Revert optimistic update on error
    revertLocalEmployee(id);
    throw error;
  }
};
```

### 4. Search Strategy

Handle different search types appropriately:

```typescript
// Client-side search for complex queries
const useClientSearch = computed(() => {
  const col = searchConfig?.column;
  return col && (col.includes('firstName') || col.includes('lastName'));
});

// Server-side search for simple columns
if (!useClientSearch.value && searchValue) {
  query = query.ilike(searchColumn, `%${searchValue}%`);
}
```

### 5. Pagination Patterns

Choose appropriate pagination based on use case:

```typescript
// Offset-based: For small to medium datasets
const tableComposable = useSupabaseTable({
  table: 'EmployeeData',
  pageSize: 10,
  useCursor: false
});

// Cursor-based: For large datasets or real-time data
const tableComposable = useSupabaseTable({
  table: 'ActivityLogs', 
  pageSize: 50,
  useCursor: true,
  orderBy: { column: 'createdAt', ascending: false }
});
```

## Real-World Examples

### 1. HRIS Employee Management

Complete implementation in `src/pages/Member/Manpower/HRIS/`:

```vue
<!-- HRISActiveTabPage.vue -->
<template>
  <supabase-g-table 
    tableKey="employeeListTable" 
    supabaseTab="active"
    ref="table">
    <template v-slot:accountDetails="props">
      <div @click="editEmployee(props)">
        {{ formatEmployeeName(props.data.accountDetails) }}
      </div>
    </template>
  </supabase-g-table>
</template>

<script>
export default {
  methods: {
    editEmployee(data) {
      this.selectedEmployeeId = data?.data?.accountId;
      this.openEditEmployeeDialog = true;
    },
    
    refreshTable() {
      this.$refs.table.refetch();
    }
  }
}
</script>
```

### 2. Employee Edit Dialog with Supabase

```vue
<!-- EditCreateEmployee.vue -->
<script>
import { useSupabaseEmployees } from 'src/composables/supabase/useSupabaseEmployees';

export default {
  props: {
    employeeId: { type: String, default: null }
  },
  
  setup() {
    const employeesComposable = useSupabaseEmployees();
    return { employeesComposable };
  },
  
  async mounted() {
    if (this.employeeId) {
      await this.fetchEmployeeData();
    }
  },
  
  methods: {
    async fetchEmployeeData() {
      this.isLoadingEmployee = true;
      try {
        const supabase = this.employeesComposable.getClient();
        const { data, error } = await supabase
          .from('EmployeeData')
          .select(`
            *,
            account:Account!inner(*, roleId),
            activeContract:EmployeeContract(*),
            branch:Project(*),
            payrollGroup:PayrollGroup(*),
            schedule:Schedule(*)
          `)
          .eq('accountId', this.employeeId)
          .single();

        if (error) throw error;
        this.localEmployeeData = this.transformEmployeeData(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        this.isLoadingEmployee = false;
      }
    }
  }
}
</script>
```

### 3. Real-time Notifications

Complete notification system implementation:

```typescript
// Component setup
const {
  notifications,
  unreadCount,
  subscribe,
  fetchAllNotifications
} = useNotificationRealtime();

// Initialize
onMounted(async () => {
  try {
    await fetchAllNotifications({ limit: 50 });
    await subscribe();
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
});

// Template usage
<template>
  <q-badge :label="unreadCount" v-if="unreadCount > 0" color="red" />
  
  <div v-for="notification in notifications" :key="notification.id">
    <div :class="{ 'unread': !notification.hasRead }">
      {{ notification.message }}
    </div>
  </div>
</template>
```

## Troubleshooting

### Common Issues

#### 1. "Cannot read properties of null (reading 'getClient')"

**Cause**: Supabase service not initialized or session not set.

**Solution**:
```typescript
// Check if client is initialized
const client = supabaseService.getClient();
if (!client) {
  console.error('Supabase client not initialized');
  return;
}
```

#### 2. "PostgREST failed to parse logic tree"

**Cause**: Using nested columns in OR filter conditions.

**Solution**: Use client-side filtering for nested searches:
```typescript
// ❌ Server-side nested OR search (not supported)
query.or(`account.firstName.ilike.%${term}%,account.lastName.ilike.%${term}%`);

// ✅ Client-side filtering
const filteredData = data.filter(item => 
  item.accountDetails?.firstName?.toLowerCase().includes(searchTerm) ||
  item.accountDetails?.lastName?.toLowerCase().includes(searchTerm)
);
```

#### 3. "Session not available for realtime subscription"

**Cause**: Attempting to subscribe to realtime before authentication.

**Solution**: 
```typescript
// Check authentication before subscribing
if (!authStore.isAuthenticated || !authStore.supabaseSession) {
  throw new Error('User not authenticated');
}

await subscribe();
```

#### 4. "RLS policy violation"

**Cause**: Missing X-Source header or incorrect RLS policy.

**Solution**: Verify header setup in axios boot file:
```typescript
// src/boot/axios.ts
api.defaults.headers.common['X-Source'] = 'frontend-main';
```

#### 5. "Initial data fetch timeout"

**Cause**: Slow API responses causing timeout in dialog components.

**Solution**: This is expected behavior with a 5-second safety timeout:
```typescript
// In EditCreateEmployee.vue - this is normal behavior
console.warn('Initial data fetch timeout - continuing anyway');
```

### Performance Tips

1. **Use pagination** for large datasets
2. **Implement caching** with appropriate TTL
3. **Limit select fields** to only what's needed
4. **Use client-side filtering** for complex searches
5. **Debounce search inputs** to reduce API calls

### Debugging

Enable Supabase debug mode:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  supabaseService.getClient().storage.setDebug(true);
}
```

Monitor realtime connections:

```typescript
realtimeService.setCallbacks({
  onConnect: () => console.log('✅ Realtime connected'),
  onDisconnect: () => console.log('❌ Realtime disconnected'),
  onError: (error) => console.error('🔥 Realtime error:', error)
});
```

## Summary

This guide covers the complete Supabase integration in frontend-main, from basic setup to advanced realtime features. The key takeaways:

1. **Use the singleton service** for all Supabase operations
2. **Leverage composables** for reusable data logic
3. **Implement proper error handling** and loading states
4. **Follow security best practices** with RLS policies
5. **Use real-time features** for dynamic user experiences

For additional help, refer to the [Supabase documentation](https://supabase.io/docs) and the existing implementations in the HRIS and notification systems.