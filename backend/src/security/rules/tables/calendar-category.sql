-- ============================================================================
-- CalendarCategory Table Security Rules
-- ============================================================================
-- Row Level Security policies for the CalendarCategory table
-- File: /src/security/rules/tables/calendar-category.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view calendar categories from their company" ON public."CalendarCategory";
DROP POLICY IF EXISTS "Users can create calendar categories for their company" ON public."CalendarCategory";
DROP POLICY IF EXISTS "Users can update calendar categories from their company" ON public."CalendarCategory";
DROP POLICY IF EXISTS "Users can delete calendar categories from their company" ON public."CalendarCategory";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view calendar categories from their company"
ON public."CalendarCategory"
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

-- Frontend users can INSERT calendar categories for their company
-- Only custom categories (non-system) can be created
CREATE POLICY "Users can create calendar categories for their company"
ON public."CalendarCategory"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only create categories for their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND
  -- Only custom categories can be created (not system categories)
  "isSystem" = false
);

-- Frontend users can UPDATE calendar categories from their company
-- Only custom categories (non-system) can be updated
CREATE POLICY "Users can update calendar categories from their company"
ON public."CalendarCategory"
FOR UPDATE
TO authenticated
USING (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only update categories from their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND
  -- Only custom categories can be updated
  "isSystem" = false
)
WITH CHECK (
  -- Ensure company association and system status cannot be changed
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND "isSystem" = false
);

-- Frontend users can DELETE calendar categories from their company
-- Only custom categories (non-system) can be deleted
CREATE POLICY "Users can delete calendar categories from their company"
ON public."CalendarCategory"
FOR DELETE
TO authenticated
USING (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only delete categories from their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND
  -- Only custom categories can be deleted
  "isSystem" = false
);
