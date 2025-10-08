-- ============================================================================
-- CalendarEventRecurrence Table Security Rules
-- ============================================================================
-- Row Level Security policies for the CalendarEventRecurrence table
-- File: /src/security/rules/tables/calendar-event-recurrence.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view event recurrence from their company" ON public."CalendarEventRecurrence";
DROP POLICY IF EXISTS "Users can create event recurrence for their company" ON public."CalendarEventRecurrence";
DROP POLICY IF EXISTS "Users can update event recurrence from their company" ON public."CalendarEventRecurrence";
DROP POLICY IF EXISTS "Users can delete event recurrence from their company" ON public."CalendarEventRecurrence";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Access is controlled through the parent CalendarEvent relationship

-- Company-filtered read policy via CalendarEvent relationship
CREATE POLICY "Users can view event recurrence from their company"
ON public."CalendarEventRecurrence"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventRecurrence"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- Frontend users can INSERT event recurrence
CREATE POLICY "Users can create event recurrence for their company"
ON public."CalendarEventRecurrence"
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventRecurrence"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- Frontend users can UPDATE event recurrence
CREATE POLICY "Users can update event recurrence from their company"
ON public."CalendarEventRecurrence"
FOR UPDATE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventRecurrence"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- Frontend users can DELETE event recurrence
CREATE POLICY "Users can delete event recurrence from their company"
ON public."CalendarEventRecurrence"
FOR DELETE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventRecurrence"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);
