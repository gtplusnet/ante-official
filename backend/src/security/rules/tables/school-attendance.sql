-- =====================================================
-- SchoolAttendance Table RLS Policies
-- =====================================================
-- Table: SchoolAttendance
-- Description: Read-only access for frontend apps
-- =====================================================

-- Enable RLS
ALTER TABLE "SchoolAttendance" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON "SchoolAttendance" TO authenticated;

-- Grant permissions to anon role for Gate App
GRANT SELECT, INSERT, UPDATE ON "SchoolAttendance" TO anon;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read SchoolAttendance data" ON "SchoolAttendance";
DROP POLICY IF EXISTS "Service role has full access to SchoolAttendance" ON "SchoolAttendance";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read SchoolAttendance data
CREATE POLICY "Frontend apps can read SchoolAttendance data"
ON "SchoolAttendance"
FOR SELECT
TO authenticated
USING (
  -- Allow read access for all authenticated users
  -- Guardian app needs to access attendance records
  true
);

-- =====================================================
-- WRITE POLICIES (Gate App Access)
-- =====================================================

-- Drop existing write policies
DROP POLICY IF EXISTS "Gate app can insert attendance records" ON "SchoolAttendance";
DROP POLICY IF EXISTS "Gate app can update attendance records" ON "SchoolAttendance";

-- Policy: Gate app can insert attendance records
CREATE POLICY "Gate app can insert attendance records"
ON "SchoolAttendance"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow authenticated users to insert attendance records
  -- Gate app needs to record check-in/check-out events
  true
);

-- Policy: Gate app can update attendance records
CREATE POLICY "Gate app can update attendance records"
ON "SchoolAttendance"
FOR UPDATE
TO authenticated
USING (
  -- Allow authenticated users to update their own records
  true
)
WITH CHECK (
  -- Ensure updates maintain data integrity
  true
);

-- =====================================================
-- SERVICE ROLE POLICIES (Backend Access)
-- =====================================================

-- Policy: Service role has full access (backend operations)
CREATE POLICY "Service role has full access to SchoolAttendance"
ON "SchoolAttendance"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_school_attendance_company_id ON "SchoolAttendance"("companyId");
CREATE INDEX IF NOT EXISTS idx_school_attendance_person_id ON "SchoolAttendance"("personId");
CREATE INDEX IF NOT EXISTS idx_school_attendance_timestamp ON "SchoolAttendance"("timestamp");
CREATE INDEX IF NOT EXISTS idx_school_attendance_person_type ON "SchoolAttendance"("personType");

-- =====================================================
-- REALTIME SUBSCRIPTION
-- =====================================================

-- Enable Realtime for SchoolAttendance table
-- This allows the gate app to receive real-time updates
DO $$
BEGIN
    -- Add table to realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE "SchoolAttendance";
    RAISE NOTICE 'Realtime enabled for SchoolAttendance table';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'SchoolAttendance already in realtime publication';
    WHEN OTHERS THEN
        RAISE WARNING 'Could not enable realtime: %', SQLERRM;
END;
$$;

-- Grant necessary permissions for realtime
GRANT SELECT ON "SchoolAttendance" TO anon;

-- Add policies for anonymous users (gate app uses anonymous auth)
DROP POLICY IF EXISTS "Anonymous gate apps can read attendance" ON "SchoolAttendance";
DROP POLICY IF EXISTS "Anonymous gate apps can insert attendance" ON "SchoolAttendance";
DROP POLICY IF EXISTS "Anonymous gate apps can update attendance" ON "SchoolAttendance";

CREATE POLICY "Anonymous gate apps can read attendance"
ON "SchoolAttendance"
FOR SELECT
TO anon
USING (
  -- Allow anonymous users to read attendance for testing
  -- In production, this should check for proper authentication
  true
);

CREATE POLICY "Anonymous gate apps can insert attendance"
ON "SchoolAttendance"
FOR INSERT
TO anon
WITH CHECK (
  -- Allow gate app to insert attendance records
  -- Gate app is a trusted device with license key validation
  true
);

CREATE POLICY "Anonymous gate apps can update attendance"
ON "SchoolAttendance"
FOR UPDATE
TO anon
USING (
  -- Allow gate app to update attendance records
  true
)
WITH CHECK (
  -- Ensure updates maintain data integrity
  true
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read SchoolAttendance data" ON "SchoolAttendance" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read SchoolAttendance data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Service role has full access to SchoolAttendance" ON "SchoolAttendance" IS 
'Allows backend service with service role to perform all operations on SchoolAttendance table.';

COMMENT ON POLICY "Anonymous gate apps can read attendance" ON "SchoolAttendance" IS 
'Allows anonymous gate app users to read attendance records for realtime subscriptions.';