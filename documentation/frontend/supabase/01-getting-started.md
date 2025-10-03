# Getting Started with Supabase in Frontend-Main

This guide covers the essential setup and basic concepts for using Supabase in the frontend-main application.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Authentication Flow](#authentication-flow)
- [Session Management](#session-management)
- [Basic Queries](#basic-queries)
- [Quick Start Example](#quick-start-example)

## Environment Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Required for Supabase access
VITE_SUPABASE_URL=https://ofnmfmwywkhosrmycltb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Enable realtime features
VITE_ENABLE_SUPABASE_REALTIME=true

# NEVER expose service key in frontend!
# SUPABASE_SERVICE_KEY=xxx  # ❌ Security risk!
```

### 2. Boot File Configuration

Ensure proper boot sequence in `quasar.config.js`:

```javascript
boot: [
  'sentry',
  'axios',    // Must run before auth
  'auth',     // Sets up Supabase session
  'multi-account',
  // ... other boot files
]
```

**Critical**: The `auth` boot must come after `axios` to ensure the X-Source header is set before Supabase initialization.

### 3. X-Source Header

The header identifies frontend to RLS policies. Set in `src/boot/axios.ts`:

```typescript
// This header enables read-only access via RLS policies
api.defaults.headers.common['X-Source'] = 'frontend-main';
```

## Authentication Flow

### How It Works

1. **User logs in via backend API** (not Supabase directly)
2. **Backend returns Supabase JWT tokens**
3. **Frontend sets Supabase session using tokens**
4. **Session persists in localStorage**
5. **Tokens auto-refresh via Supabase client**

### Implementation in Auth Store

```typescript
// src/stores/auth.ts
async initializeSupabaseSession() {
  try {
    // Get existing session from localStorage
    const { data } = await supabaseService.getSession();

    if (data?.session) {
      this.supabaseSession = data.session;
      this.supabaseInitialized = true;
      console.log('✅ Supabase session restored');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    // App continues to work with backend API fallback
  }
}

async login(credentials) {
  // 1. Login via backend
  const response = await api.post('/auth/login', credentials);

  // 2. Set Supabase session with tokens from backend
  if (response.data.supabase) {
    await supabaseService.setSession(
      response.data.supabase.access_token,
      response.data.supabase.refresh_token
    );
  }
}
```

## Session Management

### The Singleton Service

Supabase uses a singleton pattern - one client instance for the entire app:

```javascript
// src/services/supabase.js
import supabaseService from 'src/services/supabase';

// Get the singleton client
const client = supabaseService.getClient();

// Check if session exists
const { data: session } = await supabaseService.getSession();
if (!session) {
  console.log('No active session');
}

// Listen to auth changes
supabaseService.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Handle logout
  }
});
```

### Session Persistence

Sessions automatically persist across page refreshes:

```javascript
// In auth boot file (src/boot/auth.ts)
export default boot(async ({ store }) => {
  const authStore = store.auth;

  // Restore session on app start
  if (authStore.isAuthenticated) {
    await authStore.initializeSupabaseSession();
  }
});
```

## Basic Queries

### Direct Table Access

```javascript
// Get Supabase client
const supabase = supabaseService.getClient();

// Simple query
const { data, error } = await supabase
  .from('Task')
  .select('*')
  .eq('assignedToId', userId)
  .order('createdAt', { ascending: false });

if (error) {
  console.error('Query failed:', error);
  return;
}

console.log('Tasks:', data);
```

### Query with Relationships

```javascript
// Fetch tasks with related data
const { data, error } = await supabase
  .from('Task')
  .select(`
    *,
    assignedTo:Account!Task_assignedToId_fkey (
      id,
      firstName,
      lastName,
      image
    ),
    project:Project (
      id,
      name
    ),
    boardLane:BoardLane (
      id,
      name,
      key
    )
  `)
  .eq('boardLaneId', 1)  // TODO lane
  .limit(10);
```

### Using Filters

```javascript
// Complex filtering
const { data } = await supabase
  .from('Task')
  .select('*')
  .or('title.ilike.%urgent%,description.ilike.%urgent%')
  .gte('priorityLevel', 3)
  .is('isDeleted', false)
  .in('boardLaneId', [1, 2])  // TODO or IN_PROGRESS
  .order('order', { ascending: true });
```

## Quick Start Example

Here's a complete example from TaskList.vue showing real-world usage:

```vue
<template>
  <div class="task-list">
    <div v-if="loading">Loading tasks...</div>
    <div v-else>
      <div v-for="task in tasks" :key="task.id">
        {{ task.title }} - {{ task.assignedTo?.firstName }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useTaskTable } from 'src/composables/supabase/useTaskTable';
import { useAuthStore } from 'src/stores/auth';

export default {
  setup() {
    const authStore = useAuthStore();
    const tasks = ref([]);
    const loading = ref(true);

    // Use the task table composable
    const {
      data: supabaseTasks,
      loading: supabaseLoading,
      refetch
    } = useTaskTable({
      assignedToId: authStore.accountInformation?.id,
      orderBy: { column: 'createdAt', ascending: false },
      pageSize: 20,
      filters: [
        { column: 'boardLaneId', operator: 'neq', value: 3 } // Exclude DONE
      ]
    });

    // Watch for data changes
    onMounted(() => {
      // Data loads automatically with autoFetch: true
      tasks.value = supabaseTasks.value;
      loading.value = supabaseLoading.value;
    });

    return {
      tasks,
      loading,
      refetch
    };
  }
};
</script>
```

## Key Takeaways

1. **Frontend has read-only access** - All writes go through backend API
2. **Use singleton service** - One Supabase client for entire app
3. **Sessions persist automatically** - Handled by auth boot file
4. **X-Source header is critical** - Enables RLS policies
5. **Boot order matters** - axios → auth sequence required
6. **Composables provide reactivity** - Use them for automatic updates

## Next Steps

- [Table Composables](./02-table-composables.md) - Learn about data fetching patterns
- [Realtime Integration](./03-realtime-integration.md) - Add live updates
- [Component Patterns](./04-component-patterns.md) - Best practices for Vue components

## Common Pitfalls to Avoid

❌ **Don't expose service key in frontend**
```env
VITE_SUPABASE_SERVICE_KEY=xxx  # NEVER do this!
```

❌ **Don't initialize Supabase before axios**
```javascript
boot: ['auth', 'axios']  // Wrong order!
```

❌ **Don't create multiple Supabase clients**
```javascript
// Wrong - creates new client
const supabase = createClient(url, key);

// Correct - use singleton
const supabase = supabaseService.getClient();
```

❌ **Don't forget error handling**
```javascript
// Always handle errors
const { data, error } = await supabase.from('Task').select();
if (error) {
  console.error('Query failed:', error);
  // Handle error appropriately
}
```