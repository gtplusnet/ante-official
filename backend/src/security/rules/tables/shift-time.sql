-- ============================================================================
-- ShiftTime Table Security Rules
-- ============================================================================
-- Row Level Security policies for the ShiftTime table
-- NOTE: Reference table - all authenticated users can read
-- File: /src/security/rules/tables/shift-time.sql
-- ============================================================================

-- Authenticated users can read all shift times (reference data)
CREATE POLICY "authenticated_shifttimes_select" ON public."ShiftTime"
  FOR SELECT 
  TO authenticated
  USING (
    -- ShiftTime is reference data - all authenticated users can read
    true
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_shifttimes_select" ON public."ShiftTime"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read shift times
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  );