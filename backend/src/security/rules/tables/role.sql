-- ============================================================================
-- Role Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Role table
-- SECURE: RLS enabled with proper authentication and company isolation
-- File: /src/security/rules/tables/role.sql
-- ============================================================================

-- Company-based access: Users can view roles from their company
CREATE POLICY "company_roles_select" ON public."Role"
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can only see roles from their own company
    -- Use helper function to avoid recursion
    "companyId" = public.get_user_company_id()
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_roles_select" ON public."Role"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read roles from user's company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = public.get_user_company_id()
  );