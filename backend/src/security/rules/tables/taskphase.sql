-- ============================================================================
-- TaskPhase Table Security Rules
-- ============================================================================
-- Row Level Security policies for the TaskPhase table
-- Uses JWT user_metadata for company-based filtering
-- File: /src/security/rules/tables/taskphase.sql
-- ============================================================================

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'accountId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Users can view task phases from their company" ON public."TaskPhase";
DROP POLICY IF EXISTS "Users can insert task phases for their company" ON public."TaskPhase";
DROP POLICY IF EXISTS "Users can update task phases from their company" ON public."TaskPhase";

-- Company-filtered read policy for authenticated users
CREATE POLICY "Users can view task phases from their company"
ON public."TaskPhase"
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

-- Insert policy - Users can create task phases for projects in their company
CREATE POLICY "Users can insert task phases for their company"
ON public."TaskPhase"
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
    -- Verify that the project belongs to the same company
    AND EXISTS (
        SELECT 1 FROM public."Project"
        WHERE "Project"."id" = "TaskPhase"."projectId"
        AND "Project"."companyId" = "TaskPhase"."companyId"
    )
);

-- Update policy - Users can update task phases from their company
CREATE POLICY "Users can update task phases from their company"
ON public."TaskPhase"
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
    -- Ensure company ID cannot be changed
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);

-- Note: DELETE is handled via soft delete (isDeleted flag) through UPDATE policy
-- Direct DELETE operations are not allowed from frontend for audit trail purposes

-- Grant necessary permissions on the table
GRANT SELECT, INSERT, UPDATE ON public."TaskPhase" TO authenticated;

-- CRITICAL: Grant permission to use the sequence for auto-increment
GRANT USAGE, SELECT ON SEQUENCE public."TaskPhase_id_seq" TO authenticated;