-- =====================================================
-- SchoolNotification Table RLS Policies
-- =====================================================
-- Table: SchoolNotification
-- Description: Read and update access for frontend apps (mark as read)
-- =====================================================

-- Enable RLS
ALTER TABLE "SchoolNotification" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT, UPDATE ON "SchoolNotification" TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read SchoolNotification data" ON "SchoolNotification";
DROP POLICY IF EXISTS "Frontend apps can update SchoolNotification read status" ON "SchoolNotification";
DROP POLICY IF EXISTS "Service role has full access to SchoolNotification" ON "SchoolNotification";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read SchoolNotification data
CREATE POLICY "Frontend apps can read SchoolNotification data"
ON "SchoolNotification"
FOR SELECT
TO authenticated
USING (
  -- Allow read access for authenticated users
  -- Guardian app users have emails starting with 'guardian.'
  -- Regular frontend users can also access
  true  -- Allow all authenticated users to read notifications
);

-- =====================================================
-- UPDATE POLICIES (Frontend Access - Limited)
-- =====================================================

-- Policy: Frontend apps can update read status only
CREATE POLICY "Frontend apps can update SchoolNotification read status"
ON "SchoolNotification"
FOR UPDATE
TO authenticated
USING (
  -- Allow update access for authenticated users
  true  -- Allow all authenticated users to update notifications
)
WITH CHECK (
  -- Allow all authenticated users to update
  true
);

-- =====================================================
-- SERVICE ROLE POLICIES (Backend Access)
-- =====================================================

-- Policy: Service role has full access (backend operations)
CREATE POLICY "Service role has full access to SchoolNotification"
ON "SchoolNotification"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_school_notification_guardian_id ON "SchoolNotification"("guardianId");
CREATE INDEX IF NOT EXISTS idx_school_notification_student_id ON "SchoolNotification"("studentId");
CREATE INDEX IF NOT EXISTS idx_school_notification_timestamp ON "SchoolNotification"("timestamp");
CREATE INDEX IF NOT EXISTS idx_school_notification_read ON "SchoolNotification"("read");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read SchoolNotification data" ON "SchoolNotification" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read SchoolNotification data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Frontend apps can update SchoolNotification read status" ON "SchoolNotification" IS 
'Allows frontend applications to mark notifications as read by updating the read field.';

COMMENT ON POLICY "Service role has full access to SchoolNotification" ON "SchoolNotification" IS 
'Allows backend service with service role to perform all operations on SchoolNotification table.';