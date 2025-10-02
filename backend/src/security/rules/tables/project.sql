-- ============================================================================
-- Project Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Project table
-- File: /src/security/rules/tables/project.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "company_projects_select" ON public."Project";
DROP POLICY IF EXISTS "frontend_projects_select" ON public."Project";
DROP POLICY IF EXISTS "project_select_permissive" ON public."Project";
DROP POLICY IF EXISTS "project_select_company" ON public."Project";
DROP POLICY IF EXISTS "project_insert_company" ON public."Project";
DROP POLICY IF EXISTS "project_update_company" ON public."Project";
DROP POLICY IF EXISTS "Users can view projects from their company" ON public."Project";
DROP POLICY IF EXISTS "Users can create projects for their company" ON public."Project";
DROP POLICY IF EXISTS "Users can update projects from their company" ON public."Project";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view projects from their company"
ON public."Project"
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

-- Frontend users can INSERT projects for their company
CREATE POLICY "Users can create projects for their company"
ON public."Project"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only create projects for their company
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);

-- Frontend users can UPDATE projects from their company
CREATE POLICY "Users can update projects from their company"
ON public."Project"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only update projects from their company
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
)
WITH CHECK (
    -- Ensure company cannot be changed
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);