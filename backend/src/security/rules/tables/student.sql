-- =====================================================
-- Student Table RLS Policies
-- =====================================================
-- Table: Student
-- Description: Read-only access for frontend apps
-- =====================================================

-- Enable RLS
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT ON "Student" TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read Student data" ON "Student";
DROP POLICY IF EXISTS "Service role has full access to Student" ON "Student";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read Student data
CREATE POLICY "Frontend apps can read Student data"
ON "Student"
FOR SELECT
TO authenticated
USING (
  -- Allow read access for frontend applications
  -- Check if request comes from frontend using request headers
  (current_setting('request.headers', true)::json->>'x-source') IN (
    'frontend-main',
    'frontend-gate-app', 
    'frontend-guardian-app'
  )
);

-- =====================================================
-- SERVICE ROLE POLICIES (Backend Access)
-- =====================================================

-- Policy: Service role has full access (backend operations)
CREATE POLICY "Service role has full access to Student"
ON "Student"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_student_company_id ON "Student"("companyId");
CREATE INDEX IF NOT EXISTS idx_student_student_number ON "Student"("studentNumber");
CREATE INDEX IF NOT EXISTS idx_student_is_active ON "Student"("isActive");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read Student data" ON "Student" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read Student data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Service role has full access to Student" ON "Student" IS 
'Allows backend service with service role to perform all operations on Student table.';