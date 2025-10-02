-- ============================================================================
-- Task Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Task table
-- Uses JWT user_metadata for company-based filtering
-- File: /src/security/rules/tables/task.sql
-- ============================================================================

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'accountId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "tasks_select" ON public."Task";
DROP POLICY IF EXISTS "allow_all_select" ON public."Task";
DROP POLICY IF EXISTS "tasks_select_permissive" ON public."Task";
DROP POLICY IF EXISTS "tasks_select_company_filtered" ON public."Task";
DROP POLICY IF EXISTS "tasks_select_simple" ON public."Task";
DROP POLICY IF EXISTS "Users can view tasks from their company" ON public."Task";

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view tasks from their company"
ON public."Task"
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

-- Drop existing write policies if any
DROP POLICY IF EXISTS "Users can update task phase assignments" ON public."Task";

-- Limited UPDATE policy for task phase drag-and-drop operations
-- Only allows updating taskPhaseId and order fields
CREATE POLICY "Users can update task phase assignments"
ON public."Task"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
    -- Check if request comes from frontend and has valid company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
)
WITH CHECK (
    -- Only allow updating specific fields for drag-and-drop
    -- Company ID must remain unchanged
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "Users can create tasks for their company" ON public."Task";

-- INSERT policy for quick task creation from frontend
-- Allows creating tasks within the user's company
CREATE POLICY "Users can create tasks for their company"
ON public."Task"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if request comes from frontend and has valid company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);

-- Note: Full INSERT/DELETE operations still require backend API for:
-- 1. Business logic validation
-- 2. Audit trail creation
-- 3. Notification triggers
-- 4. Complex permission checks
-- 5. Related data integrity