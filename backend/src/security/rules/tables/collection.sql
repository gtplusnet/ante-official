-- ============================================================================
-- Collection Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Collection table
-- File: /src/security/rules/tables/collection.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "collection_select_company" ON public."Collection";
DROP POLICY IF EXISTS "collection_insert_company" ON public."Collection";
DROP POLICY IF EXISTS "collection_update_company" ON public."Collection";
DROP POLICY IF EXISTS "Users can view collections from their company" ON public."Collection";
DROP POLICY IF EXISTS "Users can create collections for their company" ON public."Collection";
DROP POLICY IF EXISTS "Users can update collections from their company" ON public."Collection";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view collections from their company"
ON public."Collection"
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

-- Frontend users can INSERT collections for their company
CREATE POLICY "Users can create collections for their company"
ON public."Collection"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only create collections for their company
    "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
    AND
    -- Ensure the project belongs to the same company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "Collection"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Frontend users can UPDATE collections from their company
CREATE POLICY "Users can update collections from their company"
ON public."Collection"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only update collections from their company
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
    AND
    -- Ensure the project belongs to the same company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "Collection"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);