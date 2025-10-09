-- ============================================================================
-- CalendarEvent Table Security Rules
-- ============================================================================
-- Row Level Security policies for the CalendarEvent table
-- File: /src/security/rules/tables/calendar-event.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view calendar events from their company" ON public."CalendarEvent";
DROP POLICY IF EXISTS "Users can create calendar events for their company" ON public."CalendarEvent";
DROP POLICY IF EXISTS "Users can update calendar events from their company" ON public."CalendarEvent";
DROP POLICY IF EXISTS "Users can delete calendar events from their company" ON public."CalendarEvent";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view calendar events from their company"
ON public."CalendarEvent"
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

-- Frontend users can INSERT calendar events for their company
CREATE POLICY "Users can create calendar events for their company"
ON public."CalendarEvent"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only create events for their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND
  -- Creator must be the authenticated user
  "creatorId" = (auth.jwt() ->> 'sub')
);

-- Frontend users can UPDATE calendar events from their company
CREATE POLICY "Users can update calendar events from their company"
ON public."CalendarEvent"
FOR UPDATE
TO authenticated
USING (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only update events from their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
)
WITH CHECK (
  -- Ensure company association cannot be changed
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
);

-- Frontend users can DELETE calendar events from their company
-- Only creators can delete their own events
CREATE POLICY "Users can delete calendar events from their company"
ON public."CalendarEvent"
FOR DELETE
TO authenticated
USING (
  -- Check if X-Source header is set to frontend-main
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND
  -- User can only delete events from their company
  "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
  AND
  -- Only creator can delete the event
  "creatorId" = (auth.jwt() ->> 'sub')
);
