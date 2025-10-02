# RLS Policy Management Guide

## Overview

Row Level Security (RLS) policies in the ANTE system are managed through modular SQL files that define access rules for each database table. This guide explains how to create, modify, and apply RLS policies.

## Directory Structure

```
/backend/src/security/rules/
├── _common/              # Common operations (RLS enable/disable)
├── _functions/           # Helper functions used in policies
├── _grants/              # GRANT permissions for roles
├── _indexes/             # Database indexes
├── tables/               # Individual table policies
│   ├── account.sql
│   ├── task.sql
│   ├── approval-metadata.sql
│   └── ... (one file per table)
└── apply-all.sql         # Main file that imports all rules
```

## Creating a New RLS Policy

### Step 1: Create or Edit Table Policy File

Navigate to `/backend/src/security/rules/tables/` and create/edit a file named `[table-name].sql`:

```sql
-- ============================================================================
-- [TableName] Table Security Rules
-- ============================================================================
-- Row Level Security policies for the [TableName] table
-- Uses JWT user_metadata for company-based filtering
-- File: /src/security/rules/tables/[table-name].sql
-- ============================================================================

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Enable RLS on the table
ALTER TABLE public."TableName" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "old_policy_name" ON public."TableName";
DROP POLICY IF EXISTS "Users can view [items] from their company" ON public."TableName";

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view [items] from their company"
ON public."TableName"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check if request comes from frontend and has valid company
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
);

-- Note: We intentionally DO NOT add INSERT/UPDATE/DELETE policies
-- All write operations must go through the backend API to ensure:
-- 1. Business logic validation
-- 2. Audit trail creation
-- 3. [Add table-specific reasons here]
```

### Step 2: Add GRANT Permissions

Edit `/backend/src/security/rules/_grants/authenticated.sql` to grant table access:

```sql
-- Grant permissions on your table
GRANT SELECT ON public."YourTable" TO authenticated;
GRANT INSERT ON public."YourTable" TO authenticated;  -- If needed
GRANT UPDATE ON public."YourTable" TO authenticated;  -- If needed
```

### Step 3: Apply the Policies

```bash
cd backend

# Apply all security rules
yarn security:apply --force

# Or apply specific table rules only
yarn security:apply-table=your-table --force

# Preview changes without applying
yarn security:apply --dry-run
```

## Common Policy Patterns

### 1. Company-Based Filtering (Our Standard Pattern)

Used in most tables to isolate data by company:

```sql
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view [items] from their company"
ON public."TableName"
AS PERMISSIVE  -- Explicitly declare as PERMISSIVE (Supabase AI guide recommendation)
FOR SELECT
TO authenticated
USING (
  -- Check request comes from frontend
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- Filter by company from JWT metadata (NOT auth.uid() - we use custom JWT)
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
);
```

**Important Notes:**
- We DON'T use `auth.uid()` because we don't create Supabase Auth users
- We use descriptive policy names following "Subject can action object" pattern
- We explicitly declare `AS PERMISSIVE` for clarity
- The X-Source header check adds an extra security layer

### 2. User-Specific Access

For tables where users should only see their own data:

```sql
CREATE POLICY "user_own_data" ON public."UserData"
  FOR ALL
  TO authenticated
  USING (
    "userId" = auth.uid()::text
    OR
    "accountId" = (auth.jwt() -> 'user_metadata' ->> 'accountId')::text
  );
```

### 3. Related Table Access

For tables that inherit access from related tables:

```sql
-- Policy name follows Supabase convention
CREATE POLICY "Users can view [child items] for [parent items] in their company"
ON public."ChildTable"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check request source
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."ParentTable"
    WHERE "ParentTable".id = "ChildTable"."parentId"
    AND "ParentTable"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);
```

### 4. Backend Bypass Policy

Always include a bypass policy for backend operations:

```sql
CREATE POLICY "bypass_rls_TableName" ON public."TableName"
  FOR ALL
  TO postgres, authenticated
  USING (
    -- Allow backend service role
    (auth.jwt() ->> 'role')::text = 'service_role'
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
    OR CURRENT_USER = 'postgres'
    OR CURRENT_USER LIKE '%postgres%'
  );
```

## Available Functions

### `get_user_company_id()`

Located in `/backend/src/security/rules/_functions/get-user-company.sql`

```sql
-- Use in policies to get the current user's company ID
SELECT public.get_user_company_id();

-- In a policy
CREATE POLICY "company_filter" ON public."Table"
  USING ("companyId" = public.get_user_company_id());
```

## JWT Token Structure

The JWT tokens from backend authentication contain:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "user_metadata": {
    "accountId": "account-uuid",
    "roleId": "role-uuid",
    "companyId": 16,
    "email": "user@example.com"
  }
}
```

Access these in policies using:
- `auth.jwt() -> 'user_metadata' ->> 'companyId'` - Company ID
- `auth.jwt() -> 'user_metadata' ->> 'accountId'` - Account ID
- `auth.jwt() -> 'user_metadata' ->> 'roleId'` - Role ID
- `auth.uid()` - User's Supabase ID

## Testing Policies

### 1. Create Test Script

Create a test in `/debug/` directory:

```javascript
const { createClient } = require('@supabase/supabase-js');

// Test with JWT token
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'X-Source': 'frontend-main'
    }
  }
});

// Test query
const { data, error } = await supabase
  .from('YourTable')
  .select('*');
```

### 2. Check Applied Policies

```sql
-- Run via Prisma
SELECT
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = '"YourTable"'::regclass;
```

## Important Guidelines

### From CLAUDE.md

According to the project's CLAUDE.md documentation:

1. **NEVER edit database tables directly** through Supabase Studio
2. **ALWAYS create proper migrations** using Prisma for schema changes
3. **For RLS policy changes**:
   - Edit files in `/backend/src/security/rules/`
   - Apply using `yarn security:apply --force`
4. **Frontend has controlled access** via RLS policies
5. **Backend has FULL access** (bypasses RLS)

### Security Best Practices

1. **Always include X-Source check** for frontend policies:
   ```sql
   current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
   ```

2. **Always add GRANT permissions** for tables accessed by frontend:
   ```sql
   GRANT SELECT ON public."TableName" TO authenticated;
   ```

3. **Always test policies** before production deployment:
   ```bash
   yarn security:apply --dry-run
   ```

4. **Always include bypass policy** for backend operations

## Command Reference

```bash
# List all available table rules
yarn security:list-tables

# Apply all security rules
yarn security:apply --force

# Apply specific table rules
yarn security:apply-table=task,approval-metadata --force

# Preview changes
yarn security:apply --dry-run

# Check current policies in database
yarn security:status
```

## Troubleshooting

### Common Issues

1. **"permission denied for table"**
   - Check GRANT permissions in `/_grants/authenticated.sql`
   - Verify table name spelling matches exactly
   - Ensure `yarn security:apply --force` was run

2. **"invalid input syntax for type integer"**
   - JWT metadata might be missing or malformed
   - Add COALESCE with default value:
     ```sql
     COALESCE((auth.jwt() -> 'user_metadata' ->> 'companyId')::int, 0)
     ```

3. **Policy not working as expected**
   - Check if RLS is enabled on table
   - Verify X-Source header is being sent
   - Test with simplified policy first

### Debug Queries

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'YourTable'
AND schemaname = 'public';

-- View all policies on a table
SELECT *
FROM pg_policies
WHERE tablename = 'YourTable';

-- Test JWT extraction
SELECT
  auth.jwt() -> 'user_metadata' ->> 'companyId' as company_id,
  auth.uid() as user_id;
```

## Policy Naming Standards

Following Supabase AI Prompts Guide recommendations:

### ✅ Good Policy Names (Our Pattern)
- "Users can view tasks from their company"
- "Users can view employee data from their company"
- "Users can view approval metadata for tasks in their company"
- "Users can manage their own profile"

### ❌ Poor Policy Names (Avoid)
- "tasks_select_company_filtered"
- "frontend_employees_select"
- "approval_metadata_select_authenticated"
- "company_based_access"

### Why We Use This Pattern
1. **Self-documenting**: Policy intent is clear from the name
2. **Consistent**: Follows Supabase's recommended convention
3. **Searchable**: Easy to find policies for specific actions
4. **Maintainable**: New developers understand immediately

## Our Deviations from Standard Supabase

### What We Do Differently
1. **No auth.uid()**: We use JWT metadata instead
2. **X-Source Header**: Additional security layer
3. **No Write Policies**: Frontend is read-only
4. **Custom JWT**: Backend-generated tokens
5. **Non-Expiring Tokens**: Expire in 2099

### Why These Deviations?
- **Legacy Compatibility**: Existing authentication system
- **Backend Control**: All business logic in API
- **Multi-Tenant**: Strong company isolation
- **Audit Requirements**: All writes tracked
- **Stable Connections**: No token refresh issues

**📚 Full explanation**: [RLS Approach and Deviations](./rls-approach-and-deviations.md)

## Related Documentation

- [RLS Approach and Deviations](./rls-approach-and-deviations.md) - Why we deviate from standard Supabase
- [Supabase JWT Authentication Guide](./supabase-jwt-authentication-guide.md)
- [Backend CLAUDE.md](/backend/CLAUDE.md) - Security rules section
- [Root CLAUDE.md](/CLAUDE.md) - Database security rules section
- [Prisma Migration Notes](/documentation/standards/prisma-migration-notes.md)

## Examples from Actual Implementation

### Task Table Policy
Location: `/backend/src/security/rules/tables/task.sql`

```sql
CREATE POLICY "tasks_select_company_filtered" ON public."Task"
  FOR SELECT
  TO authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  );
```

### ApprovalMetadata Policy
Location: `/backend/src/security/rules/tables/approval-metadata.sql`

```sql
CREATE POLICY "approval_metadata_select_authenticated" ON public."ApprovalMetadata"
  FOR SELECT
  TO authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND EXISTS (
      SELECT 1 FROM public."Task"
      WHERE "Task".id = "ApprovalMetadata"."taskId"
      AND "Task"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
  );
```

## Quick Start Checklist

- [ ] Create/edit policy file in `/backend/src/security/rules/tables/`
- [ ] Add DROP POLICY statements for old policies
- [ ] Create new policy with appropriate logic
- [ ] Add GRANT permissions in `/_grants/authenticated.sql`
- [ ] Run `yarn security:apply --force`
- [ ] Test with debug script
- [ ] Verify in production environment