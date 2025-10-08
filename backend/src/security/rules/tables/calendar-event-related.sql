-- ============================================================================
-- Calendar Event Related Tables Security Rules
-- ============================================================================
-- RLS policies for CalendarEventInstance, CalendarEventAttendee,
-- CalendarEventAttachment, and CalendarEventReminder tables
-- File: /src/security/rules/tables/calendar-event-related.sql
-- ============================================================================

-- ============================================================================
-- CalendarEventInstance
-- ============================================================================

DROP POLICY IF EXISTS "Users can view event instances from their company" ON public."CalendarEventInstance";
DROP POLICY IF EXISTS "Users can create event instances for their company" ON public."CalendarEventInstance";
DROP POLICY IF EXISTS "Users can update event instances from their company" ON public."CalendarEventInstance";
DROP POLICY IF EXISTS "Users can delete event instances from their company" ON public."CalendarEventInstance";

CREATE POLICY "Users can view event instances from their company"
ON public."CalendarEventInstance"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventInstance"."parentEventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can create event instances for their company"
ON public."CalendarEventInstance"
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventInstance"."parentEventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can update event instances from their company"
ON public."CalendarEventInstance"
FOR UPDATE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventInstance"."parentEventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can delete event instances from their company"
ON public."CalendarEventInstance"
FOR DELETE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventInstance"."parentEventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- ============================================================================
-- CalendarEventAttendee
-- ============================================================================

DROP POLICY IF EXISTS "Users can view event attendees from their company" ON public."CalendarEventAttendee";
DROP POLICY IF EXISTS "Users can create event attendees for their company" ON public."CalendarEventAttendee";
DROP POLICY IF EXISTS "Users can update event attendees from their company" ON public."CalendarEventAttendee";
DROP POLICY IF EXISTS "Users can delete event attendees from their company" ON public."CalendarEventAttendee";

CREATE POLICY "Users can view event attendees from their company"
ON public."CalendarEventAttendee"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttendee"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can create event attendees for their company"
ON public."CalendarEventAttendee"
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttendee"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can update event attendees from their company"
ON public."CalendarEventAttendee"
FOR UPDATE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttendee"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can delete event attendees from their company"
ON public."CalendarEventAttendee"
FOR DELETE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttendee"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- ============================================================================
-- CalendarEventAttachment
-- ============================================================================

DROP POLICY IF EXISTS "Users can view event attachments from their company" ON public."CalendarEventAttachment";
DROP POLICY IF EXISTS "Users can create event attachments for their company" ON public."CalendarEventAttachment";
DROP POLICY IF EXISTS "Users can update event attachments from their company" ON public."CalendarEventAttachment";
DROP POLICY IF EXISTS "Users can delete event attachments from their company" ON public."CalendarEventAttachment";

CREATE POLICY "Users can view event attachments from their company"
ON public."CalendarEventAttachment"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttachment"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can create event attachments for their company"
ON public."CalendarEventAttachment"
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttachment"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can update event attachments from their company"
ON public."CalendarEventAttachment"
FOR UPDATE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttachment"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can delete event attachments from their company"
ON public."CalendarEventAttachment"
FOR DELETE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventAttachment"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- ============================================================================
-- CalendarEventReminder
-- ============================================================================

DROP POLICY IF EXISTS "Users can view event reminders from their company" ON public."CalendarEventReminder";
DROP POLICY IF EXISTS "Users can create event reminders for their company" ON public."CalendarEventReminder";
DROP POLICY IF EXISTS "Users can update event reminders from their company" ON public."CalendarEventReminder";
DROP POLICY IF EXISTS "Users can delete event reminders from their company" ON public."CalendarEventReminder";

CREATE POLICY "Users can view event reminders from their company"
ON public."CalendarEventReminder"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventReminder"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can create event reminders for their company"
ON public."CalendarEventReminder"
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventReminder"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can update event reminders from their company"
ON public."CalendarEventReminder"
FOR UPDATE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventReminder"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

CREATE POLICY "Users can delete event reminders from their company"
ON public."CalendarEventReminder"
FOR DELETE
TO authenticated
USING (
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."CalendarEvent"
    WHERE "CalendarEvent".id = "CalendarEventReminder"."eventId"
    AND "CalendarEvent"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);
