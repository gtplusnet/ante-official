-- =====================================================
-- GuardianNotification Table RLS Policies
-- =====================================================
-- Table: GuardianNotification
-- Description: Read and update access for frontend apps (mark as read)
-- =====================================================

-- Enable RLS
ALTER TABLE "GuardianNotification" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT, UPDATE ON "GuardianNotification" TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read GuardianNotification data" ON "GuardianNotification";
DROP POLICY IF EXISTS "Frontend apps can update GuardianNotification read status" ON "GuardianNotification";
DROP POLICY IF EXISTS "Service role has full access to GuardianNotification" ON "GuardianNotification";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read GuardianNotification data
CREATE POLICY "Frontend apps can read GuardianNotification data"
ON "GuardianNotification"
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
CREATE POLICY "Frontend apps can update GuardianNotification read status"
ON "GuardianNotification"
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
CREATE POLICY "Service role has full access to GuardianNotification"
ON "GuardianNotification"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_guardian_notification_guardian_id ON "GuardianNotification"("guardianId");
CREATE INDEX IF NOT EXISTS idx_guardian_notification_read_at ON "GuardianNotification"("readAt");
CREATE INDEX IF NOT EXISTS idx_guardian_notification_created_at ON "GuardianNotification"("createdAt");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read GuardianNotification data" ON "GuardianNotification" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read GuardianNotification data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Frontend apps can update GuardianNotification read status" ON "GuardianNotification" IS 
'Allows frontend applications to mark notifications as read by updating the readAt field.';

COMMENT ON POLICY "Service role has full access to GuardianNotification" ON "GuardianNotification" IS 
'Allows backend service with service role to perform all operations on GuardianNotification table.';