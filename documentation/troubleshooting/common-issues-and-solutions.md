# Common Issues and Solutions

This document contains a running list of commonly encountered problems and their solutions. Update this whenever you encounter and fix a new issue.

## Table of Contents
- [Database & RLS Issues](#database--rls-issues)
- [Authentication Issues](#authentication-issues)
- [Frontend Issues](#frontend-issues)
- [Testing Issues](#testing-issues)

---

## Database & RLS Issues

### 1. RLS Policy Returns "permission denied" Despite Correct Policy

**Error:**
```
code: '42501', message: 'permission denied for table TableName'
```

**Root Cause:**
The database role (e.g., `authenticated`, `anon`) doesn't have base table permissions. RLS policies alone aren't sufficient - the role must have GRANT permissions first.

**Solution:**
```sql
-- Grant necessary permissions to the role
GRANT SELECT, INSERT, UPDATE ON public."TableName" TO authenticated;
GRANT SELECT ON public."TableName" TO anon;
```

**Example Cases:**
- Client and Location tables were blocked even with correct RLS policies because `authenticated` role lacked SELECT permissions
- BillOfQuantity, Company, and Collection tables had similar permission issues

**Prevention:**
- Always check and grant table permissions when creating new tables or RLS policies
- Use `yarn security:apply --force` to apply all security rules including grants
- Check grants with: `SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='TableName';`

---

### 2. Custom JWT Tokens Not Recognized by Supabase RLS

**Error:**
```
auth.jwt() returns null in RLS policies when using custom backend-generated JWTs
```

**Root Cause:**
Supabase's `auth.jwt()` function only recognizes tokens from Supabase Auth, not custom JWT tokens from the backend.

**Solution:**
1. For critical tables, consider using backend API instead of direct Supabase queries
2. Ensure X-Source header is properly set in Supabase client:
   ```javascript
   headers: {
     'Authorization': `Bearer ${customToken}`,
     'X-Source': 'frontend-main'  // Case sensitive!
   }
   ```
3. Use simpler RLS policies that rely on headers rather than JWT parsing

**Example Case:** Client table RLS couldn't read `companyId` from custom JWT tokens.

---

### 3. X-Source Header Case Sensitivity

**Error:**
RLS policies checking for X-Source header fail inconsistently

**Root Cause:**
HTTP headers can be case-insensitive, but PostgreSQL JSON operators are case-sensitive.

**Solution:**
Check for both cases in RLS policies:
```sql
USING (
  (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
   OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
)
```

---

## Authentication Issues

### 4. Supabase Session Not Persisting After Page Refresh

**Root Cause:**
Custom JWT tokens from backend need manual session restoration.

**Solution:**
Ensure the auth boot file properly restores the session:
1. Store tokens in localStorage when received from backend
2. Restore on app initialization in boot file
3. Set proper boot sequence in quasar.config.js (auth after axios)

**Reference:** `/frontends/frontend-main/src/boot/auth.ts`

---

## Frontend Issues

### 5. Project Page Shows Loading Spinner Indefinitely

**Error:**
Page loads but data doesn't appear, console shows 403 errors

**Root Cause:**
Usually RLS policy or permission issues preventing data fetch.

**Solution:**
1. Check browser console for specific table permission errors
2. Verify all required tables have proper GRANT permissions
3. Test with simplified RLS policies to isolate the issue
4. Use debug script to test Supabase access directly

**Debug Script:** `/frontends/frontend-main/debug/test-project-access.js`

---

## Testing Issues

### 6. Playwright Test Can't Find Login Form

**Error:**
Login form elements not found during automated testing

**Root Cause:**
Login page requires clicking "Manual Login" button first to show the form.

**Solution:**
Add Manual Login button click before filling form:
```javascript
// Click Manual Login button to show the form
const manualLoginBtn = page.locator('button:has-text("Manual Login")').first();
if (await manualLoginBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  await manualLoginBtn.click();
  await page.waitForTimeout(500);
}
```

**Reference:** `/frontends/frontend-main/tests/e2e/specs/login-and-navigate.spec.ts`

---

### 7. Wrong Port in Test URLs

**Error:**
Tests fail because they're using wrong port (9001 instead of 9000)

**Solution:**
Ensure all test URLs use correct port:
- Frontend: http://localhost:9000
- Backend API: http://localhost:3000
- Use hash routing: `http://localhost:9000/#/path`

---

## How to Update This Document

When you encounter and fix a new issue:

1. Add a new numbered entry under the appropriate section
2. Include:
   - Clear error message or symptom
   - Root cause explanation
   - Complete solution with code examples
   - Reference to relevant files
   - Prevention tips if applicable
3. Update the table of contents if adding new sections
4. Commit with message: "docs: add [issue description] to troubleshooting guide"

---

## Quick Debugging Commands

```bash
# Check RLS policies on a table
psql $DATABASE_URL -c "SELECT policyname, permissive, cmd FROM pg_policies WHERE tablename='TableName';"

# Check table permissions
psql $DATABASE_URL -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='TableName';"

# Test Supabase connection
node /frontends/frontend-main/debug/test-project-access.js

# Run specific Playwright test
npx playwright test tests/e2e/specs/login-and-navigate.spec.ts

# Apply security rules
cd backend && yarn security:apply --force
```