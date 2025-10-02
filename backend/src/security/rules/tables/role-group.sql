-- ============================================================================
-- RoleGroup Table Security Rules
-- ============================================================================
-- Row Level Security policies for the RoleGroup table
-- NOTE: Reference table - all authenticated users can read
-- File: /src/security/rules/tables/role-group.sql
-- ============================================================================

-- Authenticated users can read all role groups (reference data)
CREATE POLICY "authenticated_rolegroups_select" ON public."RoleGroup"
  FOR SELECT 
  TO authenticated
  USING (
    -- RoleGroup is reference data - all authenticated users can read
    true
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_rolegroups_select" ON public."RoleGroup"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read role groups
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  );