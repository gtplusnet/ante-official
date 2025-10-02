-- =====================================================
-- Gate Table RLS Policies
-- =====================================================
-- Table: Gate
-- Description: Read-only access for frontend apps
-- =====================================================

-- Enable RLS
ALTER TABLE "Gate" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read Gate data" ON "Gate";
DROP POLICY IF EXISTS "Service role has full access to Gate" ON "Gate";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read Gate data
CREATE POLICY "Frontend apps can read Gate data"
ON "Gate"
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
CREATE POLICY "Service role has full access to Gate"
ON "Gate"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gate_company_id ON "Gate"("companyId");
CREATE INDEX IF NOT EXISTS idx_gate_deleted_at ON "Gate"("deletedAt");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read Gate data" ON "Gate" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read Gate data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Service role has full access to Gate" ON "Gate" IS 
'Allows backend service with service role to perform all operations on Gate table.';