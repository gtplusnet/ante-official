-- =====================================================
-- Guardian Table RLS Policies
-- =====================================================
-- Table: Guardian
-- Description: Read-only access for frontend apps
-- =====================================================

-- Enable RLS
ALTER TABLE "Guardian" ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated role
GRANT SELECT ON "Guardian" TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Frontend apps can read Guardian data" ON "Guardian";
DROP POLICY IF EXISTS "Service role has full access to Guardian" ON "Guardian";

-- =====================================================
-- READ POLICIES (Frontend Access)
-- =====================================================

-- Policy: Frontend apps can read Guardian data
CREATE POLICY "Frontend apps can read Guardian data"
ON "Guardian"
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
CREATE POLICY "Service role has full access to Guardian"
ON "Guardian"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_guardian_company_id ON "Guardian"("companyId");
CREATE INDEX IF NOT EXISTS idx_guardian_is_active ON "Guardian"("isActive");
CREATE INDEX IF NOT EXISTS idx_guardian_email ON "Guardian"("email");

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Frontend apps can read Guardian data" ON "Guardian" IS 
'Allows frontend applications (main, gate-app, guardian-app) to read Guardian data. Frontend access is identified by X-Source header.';

COMMENT ON POLICY "Service role has full access to Guardian" ON "Guardian" IS 
'Allows backend service with service role to perform all operations on Guardian table.';