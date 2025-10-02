-- ============================================================================
-- PayrollGroup Table Security Rules
-- ============================================================================
-- Row Level Security policies for the PayrollGroup table
-- SECURE: RLS enabled with proper authentication and company isolation
-- File: /src/security/rules/tables/payroll-group.sql
-- ============================================================================

-- Company-based access: Users can view payroll groups from their company
CREATE POLICY "company_payrollgroups_select" ON public."PayrollGroup"
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can only see payroll groups from their own company
    -- Use helper function to avoid recursion
    "companyId" = public.get_user_company_id()
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_payrollgroups_select" ON public."PayrollGroup"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read payroll groups from user's company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = public.get_user_company_id()
  );