# Project Company Filtering Implementation

## Overview
This document describes the implementation of company-based filtering for projects in the ANTE ERP system, ensuring data isolation between companies while maintaining task functionality.

## Problem Statement
Users could potentially see projects from other companies when fetching data directly from Supabase, creating a data isolation security issue.

## Solution Approach

### Key Principles
1. **DO NOT filter tasks by company** - Tasks are already filtered by assignee/creator relationships
2. **DO filter projects by company** - Projects should only show those belonging to the user's company
3. **Keep RLS policies permissive** - ANTE uses custom JWT tokens without companyId in user_metadata

### Implementation Details

#### Frontend Changes

**1. Project List Composable (`/src/composables/useProjectList.ts`)**
- Added company filtering to ensure users only see projects from their company
- Gets company ID from auth store: `authStore.accountInformation?.company?.id`
- Adds filter: `{ column: 'companyId', operator: 'eq', value: userCompanyId }`

**2. Branches Composable (`/src/composables/supabase/useSupabaseBranches.ts`)**
- Updated all branch operations to filter by company:
  - `fetchBranches()` - Lists only company branches
  - `fetchBranchById()` - Validates branch belongs to user's company
  - `createBranch()` - Automatically sets companyId
  - `updateBranch()` - Ensures users can only update their company's branches

**3. Task List (`/src/pages/Member/Task/TaskList.vue`)**
- **IMPORTANT**: Task filtering by company is DISABLED
- Tasks use existing assignee/creator filtering
- Only the project dropdown is filtered by company

#### Backend Changes

**RLS Policy (`/backend/src/security/rules/tables/project.sql`)**
- Maintains permissive policy: `USING (true)`
- Cannot use restrictive policies because:
  - ANTE uses custom JWT tokens
  - JWT doesn't include companyId in user_metadata
  - The `get_user_company_id()` function would return 0, blocking all access

## Security Considerations

### Current Security Measures
1. **Application-level filtering** - Projects are filtered by company in frontend composables
2. **Backend API filtering** - The `/select-box/project-list` endpoint filters by company
3. **Create/Update validation** - New projects automatically get the user's company ID

### Future Improvements
When JWT structure is updated to include companyId in user_metadata:
1. Update `get_user_company_id()` function to properly extract company ID
2. Enable restrictive RLS policies at the database level
3. This will provide defense-in-depth security

## Testing Checklist
- [x] Tasks still load in all views (My Tasks, All Tasks, etc.)
- [x] Project dropdown shows only company projects
- [x] Creating new projects sets correct company ID
- [x] Branch operations respect company boundaries
- [x] Frontend builds without errors

## Files Modified
- `/frontends/frontend-main/src/composables/useProjectList.ts`
- `/frontends/frontend-main/src/composables/supabase/useSupabaseBranches.ts`
- `/frontends/frontend-main/src/pages/Member/Task/TaskList.vue` (unchanged - company filter remains disabled)
- `/backend/src/security/rules/tables/project.sql` (unchanged - remains permissive)

## Important Notes
1. Never enable task filtering by company - it will break task loading
2. The RLS policies must remain permissive until JWT structure is updated
3. Company filtering is currently enforced at the application level only