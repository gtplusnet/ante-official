-- ============================================================================
-- ProjectAccomplishment Table Security Rules
-- ============================================================================
-- Row Level Security policies for the ProjectAccomplishment table
-- File: /src/security/rules/tables/project-accomplishment.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "accomplishment_select_company" ON public."ProjectAccomplishment";
DROP POLICY IF EXISTS "accomplishment_insert_company" ON public."ProjectAccomplishment";
DROP POLICY IF EXISTS "accomplishment_update_company" ON public."ProjectAccomplishment";
DROP POLICY IF EXISTS "Users can view accomplishments from their company" ON public."ProjectAccomplishment";
DROP POLICY IF EXISTS "Users can create accomplishments for their company" ON public."ProjectAccomplishment";
DROP POLICY IF EXISTS "Users can update accomplishments from their company" ON public."ProjectAccomplishment";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users via Project relationship
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view accomplishments from their company"
ON public."ProjectAccomplishment"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Check if request comes from frontend and has valid company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only access accomplishments from projects in their company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "ProjectAccomplishment"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Frontend users can INSERT accomplishments for projects in their company
CREATE POLICY "Users can create accomplishments for their company"
ON public."ProjectAccomplishment"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only create accomplishments for projects in their company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "ProjectAccomplishment"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Frontend users can UPDATE accomplishments from projects in their company
CREATE POLICY "Users can update accomplishments from their company"
ON public."ProjectAccomplishment"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only update accomplishments from projects in their company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "ProjectAccomplishment"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
)
WITH CHECK (
    -- Ensure project association cannot be changed to a different company's project
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "ProjectAccomplishment"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);