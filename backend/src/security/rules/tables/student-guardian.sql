-- =====================================================
-- StudentGuardian Table RLS Policies
-- =====================================================
-- Table: StudentGuardian
-- Description: Read-only access for frontend apps
-- =====================================================

-- Enable RLS
ALTER TABLE "StudentGuardian" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT ON "StudentGuardian" TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read StudentGuardian data" ON "StudentGuardian";
DROP POLICY IF EXISTS "Service role has full access to StudentGuardian" ON "StudentGuardian";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read StudentGuardian data
CREATE POLICY "Frontend apps can read StudentGuardian data"
ON "StudentGuardian"
FOR SELECT
TO authenticated
USING (
  -- Allow read access for all authenticated users
  -- Guardian app users can access their student relationships
  true
);

-- =====================================================
-- SERVICE ROLE POLICIES (Backend Access)
-- =====================================================

-- Policy: Service role has full access (backend operations)
CREATE POLICY "Service role has full access to StudentGuardian"
ON "StudentGuardian"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_student_guardian_student_id ON "StudentGuardian"("studentId");
CREATE INDEX IF NOT EXISTS idx_student_guardian_guardian_id ON "StudentGuardian"("guardianId");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read StudentGuardian data" ON "StudentGuardian" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read StudentGuardian relationship data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Service role has full access to StudentGuardian" ON "StudentGuardian" IS 
'Allows backend service with service role to perform all operations on StudentGuardian table.';