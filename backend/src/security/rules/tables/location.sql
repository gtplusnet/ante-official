-- ============================================================================
-- Location Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Location table
-- File: /src/security/rules/tables/location.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "location_select_all" ON public."Location";

-- Frontend users can SELECT all locations (reference data)
-- Locations are shared across companies as they are geographic references
-- TEMPORARY: Even more permissive for testing
CREATE POLICY "location_select_all" ON public."Location"
  FOR SELECT
  TO authenticated, anon
  USING (true);  -- Allow all for now

-- Note: INSERT, UPDATE, DELETE operations are restricted to backend only
-- Locations are managed by system administrators