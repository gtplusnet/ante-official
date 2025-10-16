-- Add RRULE column for RFC 5545 standard support
ALTER TABLE "CalendarEventRecurrence" ADD COLUMN IF NOT EXISTS "rrule" TEXT;

-- Add exception dates array
ALTER TABLE "CalendarEventRecurrence" ADD COLUMN IF NOT EXISTS "exdate" TEXT[];

-- Add additional dates array
ALTER TABLE "CalendarEventRecurrence" ADD COLUMN IF NOT EXISTS "rdate" TEXT[];

-- Add comment explaining the schema
COMMENT ON COLUMN "CalendarEventRecurrence"."rrule" IS 'RFC 5545 RRULE string (e.g., RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR) - source of truth for recurrence logic';
COMMENT ON COLUMN "CalendarEventRecurrence"."exdate" IS 'Exception dates in ISO format - dates to exclude from recurrence';
COMMENT ON COLUMN "CalendarEventRecurrence"."rdate" IS 'Additional dates in ISO format - extra occurrence dates';
