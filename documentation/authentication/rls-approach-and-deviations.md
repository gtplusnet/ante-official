# RLS Approach and Deviations from Supabase AI Prompts Guide

## Overview

The ANTE system uses a hybrid authentication approach that intentionally deviates from standard Supabase patterns. This document explains our approach, the reasons for our deviations, and how our implementation differs from the Supabase AI Prompts Guide recommendations.

## Our Authentication Architecture

### Key Differences from Standard Supabase

1. **Custom JWT Tokens**: We generate our own JWT tokens from the backend instead of using Supabase Auth
2. **Non-Expiring Tokens**: Tokens expire in 2099 to maintain stable Supabase API connections
3. **Custom User Metadata**: JWT contains `user_metadata` with `companyId`, `roleId`, and `accountId`
4. **No Supabase Auth Users**: We don't create users in Supabase Auth system
5. **Account.id vs supabaseUserId**: Our Account.id is different from Supabase's auth.uid()

### Why These Deviations?

1. **Legacy System Compatibility**: The system was built with custom authentication before Supabase integration
2. **Multi-Account Support**: Users can switch between companies without re-authentication
3. **Backend Control**: All authentication logic remains in the backend for consistency
4. **Stable Connections**: Non-expiring tokens prevent Supabase client disconnections
5. **Existing User Base**: Migrating existing users to Supabase Auth would be complex and risky

## RLS Policy Patterns

### Our Pattern vs Supabase AI Prompts Guide

#### Supabase AI Prompts Guide Recommendations:
```sql
-- Standard Supabase pattern using auth.uid()
CREATE POLICY "Users can view their own records"
ON public.table_name
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### Our Implementation:
```sql
-- Our pattern using JWT user_metadata
CREATE POLICY "Users can view records from their company"
ON public.table_name
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check request source for security
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  -- Filter by company from custom JWT metadata
  AND "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
);
```

### Key Differences in Our Policies

1. **No auth.uid() Usage**
   - We can't use `auth.uid()` because we don't create Supabase Auth users
   - Instead, we use `auth.jwt() -> 'user_metadata'` to access custom JWT claims

2. **X-Source Header Check**
   - Additional security layer to ensure requests come from our frontend
   - Prevents direct API access with just a JWT token

3. **Company-Based Filtering**
   - Most policies filter by `companyId` for multi-tenant isolation
   - Company ID comes from JWT metadata, not Supabase Auth

4. **No Write Policies for Frontend**
   - Frontend only has SELECT permissions
   - All INSERT/UPDATE/DELETE operations go through backend API
   - This ensures business logic validation and audit trails

5. **AS PERMISSIVE Declaration**
   - We follow the guide's recommendation to explicitly declare AS PERMISSIVE
   - This makes the intent clear even though PERMISSIVE is the default

## Policy Naming Convention

We follow Supabase's recommended naming pattern:
- **Format**: "Subject can action object"
- **Examples**:
  - "Users can view tasks from their company"
  - "Users can view employee data from their company"
  - "Users can view approval metadata for tasks in their company"

## Security Considerations

### Strengths of Our Approach

1. **Backend Control**: Authentication logic remains centralized in backend
2. **Company Isolation**: Strong multi-tenant separation through company filtering
3. **Request Validation**: X-Source header prevents unauthorized direct access
4. **Audit Trail**: All writes go through backend for proper logging
5. **Business Logic**: Complex validations handled by backend services

### Trade-offs

1. **No Supabase Auth Features**: We can't use Supabase's built-in auth features
2. **Manual Token Management**: We handle token generation and validation
3. **Custom Session Handling**: Frontend must manually manage JWT sessions
4. **No auth.uid() Policies**: Can't use standard Supabase policy patterns

## Implementation Guidelines

### When Creating New Policies

1. **Always use descriptive names**: Follow "Subject can action object" pattern
2. **Include AS PERMISSIVE**: Make policy type explicit
3. **Add X-Source check**: Ensure requests come from frontend
4. **Use company filtering**: Filter by companyId from JWT metadata
5. **Document deviations**: Explain why we don't use auth.uid()
6. **No write policies**: Only create SELECT policies for frontend

### Example Template

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

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "old_policy_names" ON public."TableName";

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
-- 3. [Specific reasons for this table]
```

## Testing Policies

### Debug Script Pattern

```javascript
// Test with our custom JWT tokens
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: {
      'Authorization': `Bearer ${customJwtToken}`, // Our backend JWT
      'X-Source': 'frontend-main' // Required for policies
    }
  }
});
```

### Common Issues and Solutions

1. **"Permission denied for table"**
   - Check if GRANT SELECT is added for authenticated role
   - Verify X-Source header is set
   - Ensure JWT contains user_metadata.companyId

2. **"Cannot read property 'companyId' of null"**
   - JWT might be missing user_metadata
   - Use COALESCE to provide default value

3. **Policy not filtering correctly**
   - Check if company ID in JWT matches database records
   - Verify the policy logic for complex joins

## Migration Path

### If We Ever Move to Standard Supabase Auth

1. **Create Supabase Auth users** for all existing accounts
2. **Map Account.id to auth.uid()** in a migration table
3. **Update all policies** to use auth.uid() instead of JWT metadata
4. **Migrate frontend** to use Supabase Auth client
5. **Update backend** to validate Supabase sessions

### Why We Haven't Migrated

1. **Risk**: Large existing user base with active sessions
2. **Complexity**: Multi-account switching would need redesign
3. **Cost**: Significant development and testing effort
4. **Stability**: Current system works reliably
5. **Features**: We don't need Supabase Auth features currently

## Conclusion

Our RLS approach prioritizes:
1. **Backward compatibility** with existing authentication
2. **Backend control** over all business logic
3. **Security** through multiple validation layers
4. **Stability** with non-expiring tokens
5. **Flexibility** for future migration if needed

While we deviate from Supabase's standard patterns, our approach is intentional and well-suited to our specific requirements. The deviations are documented and consistent across all policies.

## Related Documentation

- [Supabase JWT Authentication Guide](./supabase-jwt-authentication-guide.md)
- [RLS Policy Management Guide](./rls-policy-management-guide.md)
- [Backend CLAUDE.md](/backend/CLAUDE.md)
- [Root CLAUDE.md](/CLAUDE.md)
- [Supabase AI Prompts Guide](https://supabase.com/docs/guides/ai/prompts) (External)