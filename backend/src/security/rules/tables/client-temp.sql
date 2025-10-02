-- ============================================================================
-- Client Table Security Rules - TEMPORARY SOLUTION
-- ============================================================================
-- Simplified RLS policy for Client table that works with custom JWTs
-- File: /src/security/rules/tables/client-temp.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "client_select_company" ON public."Client";
DROP POLICY IF EXISTS "client_insert_company" ON public."Client";
DROP POLICY IF EXISTS "client_update_company" ON public."Client";
DROP POLICY IF EXISTS "client_delete_company" ON public."Client";
DROP POLICY IF EXISTS "Users can view clients from their company" ON public."Client";
DROP POLICY IF EXISTS "Users can create clients for their company" ON public."Client";
DROP POLICY IF EXISTS "Users can update clients from their company" ON public."Client";

-- TEMPORARY SOLUTION: Allow frontend access based on X-Source header
-- This is a workaround until we resolve the custom JWT issue with auth.jwt()
CREATE POLICY "Frontend users can view all clients"
ON public."Client"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Only check if request comes from frontend
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
);

-- Frontend users can INSERT clients
CREATE POLICY "Frontend users can create clients"
ON public."Client"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
);

-- Frontend users can UPDATE clients
CREATE POLICY "Frontend users can update clients"
ON public."Client"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
)
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    (current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
     OR current_setting('request.headers', true)::json->>'X-Source' = 'frontend-main')
);