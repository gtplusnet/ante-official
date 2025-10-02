# Supabase AI Prompts Guide for ANTE ERP System

## Overview

This guide contains curated AI prompts from Supabase, adapted and organized for the ANTE ERP system. These prompts help leverage AI-powered development tools (like Claude Code, Cursor, GitHub Copilot) to work more efficiently with our Supabase integration.

## When to Use These Prompts

Use these prompts when:
- Creating or modifying database schemas
- Writing RLS (Row Level Security) policies
- Creating database functions and triggers
- Working with Supabase realtime features
- Implementing database migrations
- Optimizing SQL queries

## Prompt Categories for ANTE System

### 🔐 1. RLS Policies (HIGH RELEVANCE)
**ANTE Context**: All RLS policies are managed in `/backend/src/security/rules/tables/[table-name].sql`

```yaml
---
description: Guidelines for writing Postgres Row Level Security policies for ANTE
alwaysApply: false
---

# Database: Create RLS policies for ANTE

You're a Supabase Postgres expert in writing row level security policies for the ANTE ERP system.

**ANTE-Specific Context:**
- RLS policies are centrally managed in `/backend/src/security/rules/tables/[table-name].sql`
- Frontend uses `X-Source: frontend-main` header for RLS identification
- Backend has FULL database access (no RLS restrictions)
- Use `auth.uid()` for user identification
- Check user roles from the `user_role` table

**Policy Generation Rules:**
- The generated SQL must be valid SQL
- Use only CREATE POLICY or ALTER POLICY queries
- Always use double apostrophe in SQL strings (eg. 'Night''s watch')
- Always use "auth.uid()" instead of "current_user"
- SELECT policies: always have USING but not WITH CHECK
- INSERT policies: always have WITH CHECK but not USING
- UPDATE policies: always have WITH CHECK and most often have USING
- DELETE policies: always have USING but not WITH CHECK
- Don't use `FOR ALL`. Create 4 separate policies for select, insert, update, delete
- Policy names should be descriptive, enclosed in double quotes
- Prefer `PERMISSIVE` over `RESTRICTIVE` policies

**ANTE Policy Pattern:**
```sql
-- Example for ANTE system
CREATE POLICY "Users can view their own records"
ON public.user_profile
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all records"
ON public.user_profile
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role
        WHERE user_role.user_id = auth.uid()
        AND user_role.role_id IN (
            SELECT id FROM public.role WHERE name = 'admin'
        )
    )
);
```

### 📊 2. Database Functions (HIGH RELEVANCE)
**ANTE Context**: Used for complex business logic, triggers, and data validations

```yaml
---
description: Guidelines for writing Supabase database functions for ANTE
alwaysApply: false
---

# Database: Create functions for ANTE

You're a Supabase Postgres expert writing database functions for the ANTE ERP system.

**ANTE-Specific Guidelines:**
1. **Default to `SECURITY INVOKER`** - Functions run with user permissions
2. **Set `search_path` to empty string** - Always use fully qualified names
3. **Use schema prefix** - ANTE uses `public` schema primarily
4. **Consider existing tables**: account, user_profile, project, task, etc.
5. **Follow ANTE naming conventions**: snake_case for functions and tables

**Function Template for ANTE:**
```sql
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_progress NUMERIC;
BEGIN
    SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
        END
    INTO v_progress
    FROM public.task
    WHERE project_id = p_project_id;

    RETURN ROUND(v_progress, 2);
END;
$$;
```

**Common ANTE Use Cases:**
- Calculating project metrics
- User permission checks
- Audit trail triggers
- Data validation functions
- Notification triggers

### 🔄 3. Database Migrations (HIGH RELEVANCE)
**ANTE Context**: Critical for schema changes without direct database edits

```yaml
---
description: Guidelines for writing Postgres migrations for ANTE
alwaysApply: false
---

# Database: Create migration for ANTE

You are creating migrations for the ANTE ERP system using Prisma and Supabase.

**ANTE Migration Rules:**
- NEVER use `prisma migrate dev` - Supabase has no shadow database
- Create migration files manually in `/backend/prisma/migrations/`
- Use `prisma migrate deploy` to apply migrations
- File naming: `YYYYMMDDHHmmss_short_description.sql`

**Migration Template for ANTE:**
```sql
-- Migration: Add notification preferences to user_profile
-- Purpose: Allow users to configure notification settings
-- Author: ANTE Development Team
-- Date: 2025-09-18

-- Add notification preferences column
ALTER TABLE public.user_profile
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "project_updates": true,
    "task_assignments": true
}'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profile_notification_preferences
ON public.user_profile USING GIN (notification_preferences);

-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profile.notification_preferences
IS 'User notification preferences for different channels and event types';
```

### 🎯 4. SQL Query Optimization (HIGH RELEVANCE)
**ANTE Context**: Optimize queries for large datasets in project management

```yaml
---
description: SQL formatting and optimization for ANTE
alwaysApply: false
---

# SQL Style Guide for ANTE

Format and optimize SQL queries for the ANTE ERP system.

**ANTE Query Patterns:**
```sql
-- Optimized query for project dashboard
WITH project_summary AS (
    SELECT
        p.id,
        p.name,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
        COUNT(DISTINCT tm.user_id) AS team_members
    FROM public.project p
    LEFT JOIN public.task t ON t.project_id = p.id
    LEFT JOIN public.project_member tm ON tm.project_id = p.id
    WHERE p.account_id = $1
    GROUP BY p.id, p.name
)
SELECT
    *,
    CASE
        WHEN total_tasks = 0 THEN 0
        ELSE ROUND((completed_tasks::NUMERIC / total_tasks::NUMERIC) * 100, 2)
    END AS progress_percentage
FROM project_summary
ORDER BY p.name;
```

**Optimization Guidelines:**
- Add indexes on foreign keys and frequently filtered columns
- Use CTEs for complex queries
- Avoid N+1 queries by using proper JOINs
- Use EXPLAIN ANALYZE to verify performance

### 🔴 5. Supabase Realtime (MEDIUM RELEVANCE)
**ANTE Context**: Used for notifications, task updates, and live collaboration

```yaml
---
description: Implementing Supabase Realtime for ANTE
alwaysApply: false
---

# Implementing Realtime Features for ANTE

Configure and use Supabase Realtime in the ANTE ERP system.

**ANTE Realtime Implementation:**
```javascript
// Frontend: Vue.js composable for realtime
// File: /frontends/frontend-main/src/composables/supabase/useRealtimeNotifications.js

import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

export function useRealtimeNotifications() {
    const notifications = ref([])
    const authStore = useAuthStore()
    let channel = null

    const subscribeToNotifications = () => {
        channel = supabase
            .channel(`notifications:${authStore.userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${authStore.userId}`
                },
                (payload) => {
                    notifications.value.unshift(payload.new)
                }
            )
            .subscribe()
    }

    onMounted(() => {
        if (authStore.isAuthenticated) {
            subscribeToNotifications()
        }
    })

    onUnmounted(() => {
        if (channel) {
            supabase.removeChannel(channel)
        }
    })

    return {
        notifications
    }
}
```

**ANTE Realtime Use Cases:**
- Task assignment notifications
- Project status updates
- Team member activity feed
- Real-time dashboard metrics
- Chat/messaging features

### ❌ 6. Edge Functions (LOW RELEVANCE)
**ANTE Context**: ANTE uses NestJS backend, not Edge Functions

> **Note**: ANTE uses a NestJS backend API instead of Supabase Edge Functions. This prompt is included for reference but is not applicable to the current architecture.

### ❌ 7. Next.js Authentication (NOT APPLICABLE)
**ANTE Context**: ANTE uses Vue.js/Quasar with custom token authentication

> **Note**: ANTE uses Vue.js with Quasar framework and custom 40-character hex token authentication, not Next.js with Supabase Auth.

## How to Use These Prompts

### With Claude Code (Recommended for ANTE)
1. Copy the relevant prompt section
2. Include it in your request when working on database-related tasks
3. Provide ANTE-specific context (table names, business logic)

### With Cursor
1. Save prompts to `.cursor/rules` directory in your project
2. Reference with `@rules` in your prompts

### With GitHub Copilot
1. Save prompts to a file (e.g., `prompts/database.md`)
2. Reference with `#prompts/database.md`

### With Zed
1. Save prompts to your project
2. Reference with `/file prompts/database.md`

## Best Practices for ANTE

1. **Always Edit RLS in Source Files**:
   - Edit `/backend/src/security/rules/tables/[table-name].sql`
   - Apply with `yarn security:apply --force`

2. **Test Policies Locally**:
   - Use local Supabase instance for testing
   - Verify with different user roles

3. **Migration Workflow**:
   - Create migration file manually
   - Test on staging first
   - Apply with `prisma migrate deploy`

4. **Performance Monitoring**:
   - Use EXPLAIN ANALYZE for slow queries
   - Add indexes based on actual usage patterns
   - Monitor RLS policy performance impact

## Common ANTE Tables Reference

For context when using these prompts:
- `account` - Organization/company accounts
- `user_profile` - User information
- `user_role` - User role assignments
- `project` - Project management
- `task` - Task tracking
- `notification` - User notifications
- `activity_log` - Audit trail
- `project_member` - Project team assignments

## Additional Resources

- [Supabase AI Prompts Documentation](https://supabase.com/docs/guides/getting-started/ai-prompts)
- [ANTE Database Architecture](/documentation/architecture/backend-structure-guide.md)
- [ANTE RLS Policy Management](/backend/src/security/rules/README.md)
- [ANTE Frontend Supabase Integration](/frontends/frontend-main/docs/SUPABASE_INTEGRATION.md)