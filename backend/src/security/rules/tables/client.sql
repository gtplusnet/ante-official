-- ============================================================================
-- Client Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Client table
-- File: /src/security/rules/tables/client.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "client_select_company" ON public."Client";
DROP POLICY IF EXISTS "client_insert_company" ON public."Client";
DROP POLICY IF EXISTS "client_update_company" ON public."Client";
DROP POLICY IF EXISTS "client_delete_company" ON public."Client";
DROP POLICY IF EXISTS "Users can view clients from their company" ON public."Client";
DROP POLICY IF EXISTS "Users can create clients for their company" ON public."Client";
DROP POLICY IF EXISTS "Users can update clients from their company" ON public."Client";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- IMPORTANT: Client.companyId is nullable. Most clients are associated with companies
-- through Projects, not directly. We need to check both paths.

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view clients from their company"
ON public."Client"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Check if request comes from frontend (handle both lowercase and mixed case)
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
    AND (
      -- Path 1: Direct association - Client belongs directly to company (rare)
      ("companyId" IS NOT NULL AND "companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      ))
      OR
      -- Path 2: Indirect association - Client is used by a project in user's company (common)
      EXISTS (
        SELECT 1 FROM public."Project"
        WHERE "Project"."clientId" = "Client".id
        AND "Project"."companyId" = COALESCE(
          (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
          0
        )
      )
    )
);

-- Frontend users can INSERT clients
-- New clients can be created either with direct company association or for a project
CREATE POLICY "Users can create clients for their company"
ON public."Client"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main (handle both cases)
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
    AND (
      -- Allow creating with direct company association
      ("companyId" IS NULL)  -- Allow creating without companyId (will be associated via project)
      OR
      ("companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      ))
    )
);

-- Frontend users can UPDATE clients from their company
CREATE POLICY "Users can update clients from their company"
ON public."Client"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main (handle both cases)
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
    AND (
      -- Path 1: Direct association - Client belongs directly to company
      ("companyId" IS NOT NULL AND "companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      ))
      OR
      -- Path 2: Indirect association - Client is used by a project in user's company
      EXISTS (
        SELECT 1 FROM public."Project"
        WHERE "Project"."clientId" = "Client".id
        AND "Project"."companyId" = COALESCE(
          (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
          0
        )
      )
    )
)
WITH CHECK (
    -- Ensure company cannot be changed to a different company
    ("companyId" IS NULL)  -- Allow keeping it null
    OR
    ("companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    ))
);