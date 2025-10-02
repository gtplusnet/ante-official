# Security Best Practices - RLS and Token Management

This guide covers security implementation including Row Level Security policies, token management, and common security pitfalls.

## Table of Contents
- [Row Level Security (RLS)](#row-level-security-rls)
- [X-Source Header Pattern](#x-source-header-pattern)
- [Token Management](#token-management)
- [Security Patterns](#security-patterns)
- [Common Security Pitfalls](#common-security-pitfalls)
- [Audit and Monitoring](#audit-and-monitoring)

## Row Level Security (RLS)

### Understanding RLS

RLS policies control data access at the database level:

```sql
-- Frontend read-only policy
CREATE POLICY "frontend_read_only" ON "Task"
FOR SELECT TO anon USING (
  -- Check X-Source header
  current_setting('request.headers')::json->>'x-source' = 'frontend-main'
  AND
  -- Check company context
  companyId = current_setting('app.company_id')::integer
);

-- Backend full access
CREATE POLICY "backend_full_access" ON "Task"
FOR ALL TO service_role USING (true);
```

### Frontend Read-Only Pattern

```sql
-- All frontend policies follow this pattern
CREATE POLICY "frontend_[table]_read" ON "[Table]"
FOR SELECT  -- Only SELECT, never INSERT/UPDATE/DELETE
TO anon     -- Using anon role (public key)
USING (
  current_setting('request.headers')::json->>'x-source' = 'frontend-main'
);
```

### Company-Scoped Access

```sql
-- Ensure users only see their company's data
CREATE POLICY "company_scoped_read" ON "Task"
FOR SELECT TO anon USING (
  current_setting('request.headers')::json->>'x-source' = 'frontend-main'
  AND
  companyId = auth.jwt() -> 'company_id'
);
```

### User-Specific Policies

```sql
-- Personal data access
CREATE POLICY "user_own_data" ON "UserNotification"
FOR SELECT TO anon USING (
  current_setting('request.headers')::json->>'x-source' = 'frontend-main'
  AND
  recipientId = auth.uid()
);
```

## X-Source Header Pattern

### Implementation

```typescript
// src/boot/axios.ts - Set before Supabase init
import { boot } from 'quasar/wrappers';
import axios from 'axios';

export default boot(({ app }) => {
  // Create axios instance
  const api = axios.create({
    baseURL: process.env.VITE_API_URL
  });

  // CRITICAL: Set X-Source header for RLS
  api.defaults.headers.common['X-Source'] = 'frontend-main';

  // Make available globally
  app.config.globalProperties.$api = api;
});
```

### Supabase Client Configuration

```javascript
// src/services/supabase.js
class SupabaseService {
  getAuthenticatedClient(accessToken) {
    // Create client with custom headers
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'X-Source': 'frontend-main',  // For RLS policies
          'Authorization': `Bearer ${accessToken}`
        }
      }
    });
  }
}
```

### Boot Order Importance

```javascript
// quasar.config.js - Order matters!
boot: [
  'sentry',      // Error tracking
  'axios',       // Sets X-Source header
  'auth',        // Uses axios headers for Supabase
  'supabase',    // Initialize with headers set
]
```

## Token Management

### Never Expose Service Key

```env
# ❌ NEVER in frontend .env
VITE_SUPABASE_SERVICE_KEY=xxx  # Security breach!

# ✅ Only anon key in frontend
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### Token Storage Pattern

```typescript
// Secure token storage
class TokenManager {
  // Store in memory, not localStorage for sensitive tokens
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    // Store refresh token in httpOnly cookie via backend
    api.post('/auth/store-refresh', { refreshToken: refresh });
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async refreshAccessToken(): Promise<string> {
    // Refresh via backend, not directly with Supabase
    const response = await api.post('/auth/refresh');
    this.accessToken = response.data.accessToken;
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    api.post('/auth/clear-refresh');
  }
}
```

### Session Lifecycle

```typescript
// src/stores/auth.ts
async initializeSupabaseSession() {
  try {
    // Check for existing session
    const { data } = await supabaseService.getSession();

    if (!data?.session) {
      // No session, user needs to login
      return;
    }

    // Validate session is still valid
    const isValid = await this.validateSession(data.session);
    if (!isValid) {
      await supabaseService.signOut();
      return;
    }

    this.supabaseSession = data.session;
    this.supabaseInitialized = true;
  } catch (error) {
    console.error('Session init failed:', error);
    // Continue without Supabase, fallback to API
  }
}

async validateSession(session: Session): Promise<boolean> {
  // Verify with backend
  try {
    const response = await api.post('/auth/validate-session', {
      accessToken: session.access_token
    });
    return response.data.valid;
  } catch {
    return false;
  }
}
```

## Security Patterns

### Read-Only Frontend Pattern

```typescript
// ✅ CORRECT: Read from Supabase, write via API
export const TaskService = {
  // Read directly from Supabase
  async getTasks() {
    const { data } = await supabase
      .from('Task')
      .select('*');
    return data;
  },

  // Write through backend API
  async createTask(task: Partial<Task>) {
    const response = await api.post('/task', task);
    return response.data;
  },

  async updateTask(id: number, updates: Partial<Task>) {
    const response = await api.patch(`/task/${id}`, updates);
    return response.data;
  }
};

// ❌ WRONG: Direct writes from frontend
async createTaskWRONG(task: Partial<Task>) {
  // This will fail with RLS policies
  const { data } = await supabase
    .from('Task')
    .insert(task);  // ❌ Will be blocked by RLS
  return data;
}
```

### Input Validation

```typescript
// Always validate on frontend AND backend
const validateTaskInput = (task: Partial<Task>): ValidationResult => {
  const errors: string[] = [];

  // Title validation
  if (!task.title?.trim()) {
    errors.push('Title is required');
  }
  if (task.title && task.title.length > 255) {
    errors.push('Title too long');
  }

  // XSS prevention
  if (task.title && /<script|javascript:/i.test(task.title)) {
    errors.push('Invalid characters in title');
  }

  // Date validation
  if (task.dueDate && new Date(task.dueDate) < new Date()) {
    errors.push('Due date cannot be in the past');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Use before API calls
const createTask = async (taskData: Partial<Task>) => {
  const validation = validateTaskInput(taskData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Sanitize input
  const sanitized = {
    ...taskData,
    title: DOMPurify.sanitize(taskData.title || ''),
    description: DOMPurify.sanitize(taskData.description || '')
  };

  return await api.post('/task', sanitized);
};
```

### Secure Data Filtering

```typescript
// Filter sensitive data in queries
const getPublicUserData = async () => {
  const { data } = await supabase
    .from('Account')
    .select(`
      id,
      firstName,
      lastName,
      image
    `);  // Never select password, tokens, etc.

  return data;
};

// Hide sensitive fields in transformations
const transformUserData = (user: any) => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  avatar: user.image,
  // Don't include: email, phone, salary, etc.
});
```

## Common Security Pitfalls

### 1. Exposing Service Keys

```typescript
// ❌ NEVER do this
const supabase = createClient(url, SERVICE_KEY);

// ❌ Don't log sensitive data
console.log('Token:', accessToken);  // Security risk

// ✅ Use anon key only
const supabase = createClient(url, ANON_KEY);

// ✅ Log safely
console.log('User authenticated:', !!accessToken);
```

### 2. Missing RLS Policies

```sql
-- ❌ Table without RLS is accessible to all
CREATE TABLE sensitive_data (
  id SERIAL PRIMARY KEY,
  secret TEXT
);

-- ✅ Always enable RLS
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- ✅ Add restrictive policies
CREATE POLICY "no_access" ON sensitive_data
FOR ALL TO anon USING (false);  -- Block all access
```

### 3. Client-Side Authorization

```typescript
// ❌ WRONG: Security check only on frontend
if (user.role === 'admin') {
  showAdminPanel();  // Can be bypassed
}

// ✅ CORRECT: Backend validates all actions
const showAdminPanel = async () => {
  try {
    const response = await api.get('/admin/verify');
    if (response.data.isAdmin) {
      // Backend confirmed admin status
      renderAdminPanel();
    }
  } catch {
    // Not authorized
  }
};
```

### 4. Unsafe Direct Object References

```typescript
// ❌ WRONG: Using user input directly
const getTask = async (taskId: string) => {
  const { data } = await supabase
    .from('Task')
    .select('*')
    .eq('id', taskId)  // Could access any task
    .single();
  return data;
};

// ✅ CORRECT: Validate ownership
const getTask = async (taskId: string) => {
  const { data } = await supabase
    .from('Task')
    .select('*')
    .eq('id', taskId)
    .eq('companyId', currentCompanyId)  // Scoped to company
    .single();

  // Additional backend validation
  if (data && !canUserAccessTask(data)) {
    throw new Error('Unauthorized');
  }

  return data;
};
```

### 5. Race Conditions

```typescript
// ❌ WRONG: Multiple users updating simultaneously
const updateTaskOrder = async (taskId: number, newOrder: number) => {
  await api.patch(`/task/${taskId}`, { order: newOrder });
};

// ✅ CORRECT: Use transactions and locks
const updateTaskOrder = async (updates: OrderUpdate[]) => {
  // Backend handles as transaction
  await api.post('/task/reorder', {
    updates,
    timestamp: Date.now()  // For conflict resolution
  });
};
```

## Audit and Monitoring

### Activity Logging

```typescript
// Log security-relevant actions
const auditLog = {
  action: 'TASK_UPDATE',
  userId: currentUserId,
  taskId: task.id,
  changes: updates,
  timestamp: new Date().toISOString(),
  ip: await getUserIP(),
  userAgent: navigator.userAgent
};

// Send to backend for storage
await api.post('/audit/log', auditLog);
```

### Rate Limiting

```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(endpoint: string, limit = 10, window = 60000): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(endpoint) || [];

    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < window);

    if (recent.length >= limit) {
      return false;  // Rate limit exceeded
    }

    recent.push(now);
    this.requests.set(endpoint, recent);
    return true;
  }
}

const rateLimiter = new RateLimiter();

const createTask = async (data: any) => {
  if (!rateLimiter.canMakeRequest('createTask')) {
    throw new Error('Too many requests. Please slow down.');
  }

  return await api.post('/task', data);
};
```

### Error Handling

```typescript
// Don't leak sensitive info in errors
const handleError = (error: any) => {
  // Log full error internally
  console.error('Full error:', error);

  // Show generic message to user
  let userMessage = 'An error occurred';

  if (error.response?.status === 401) {
    userMessage = 'Please login again';
  } else if (error.response?.status === 403) {
    userMessage = 'You don\'t have permission';
  } else if (error.response?.status === 429) {
    userMessage = 'Too many requests';
  }

  Notify.create({
    type: 'negative',
    message: userMessage  // Safe message
  });
};
```

## Security Checklist

### Environment Setup
- [ ] Only ANON key in frontend environment
- [ ] X-Source header configured
- [ ] Boot files in correct order
- [ ] HTTPS enforced in production

### RLS Policies
- [ ] All tables have RLS enabled
- [ ] Frontend has SELECT-only policies
- [ ] Policies check X-Source header
- [ ] Company/user scoping implemented

### Token Management
- [ ] Service key never exposed
- [ ] Tokens stored securely
- [ ] Session validation implemented
- [ ] Refresh mechanism working

### Data Security
- [ ] Input validation on frontend
- [ ] Input sanitization before display
- [ ] Sensitive data filtered from queries
- [ ] No direct object references

### Monitoring
- [ ] Audit logging implemented
- [ ] Rate limiting active
- [ ] Error messages sanitized
- [ ] Security headers configured

## Best Practices Summary

1. **Never trust the frontend** - All security must be enforced backend
2. **Use RLS as defense in depth** - Not the only security layer
3. **Validate everything twice** - Frontend for UX, backend for security
4. **Log security events** - But don't log sensitive data
5. **Fail securely** - Default to denying access
6. **Keep keys secret** - Never commit or expose keys
7. **Update regularly** - Keep Supabase client updated

## Next Steps

- [Troubleshooting Guide](./08-troubleshooting-guide.md) - Debug security issues
- [Getting Started](./01-getting-started.md) - Review setup requirements
- [CRUD Operations](./05-crud-operations.md) - Secure data operations