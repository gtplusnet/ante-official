-- ============================================================================
-- EmployeeContract Table Security Rules
-- ============================================================================
-- Row Level Security policies for the EmployeeContract table
-- SECURE: RLS enabled with proper authentication and company isolation
-- File: /src/security/rules/tables/employee-contract.sql
-- ============================================================================

-- Company-based access: Users can view contracts from their company
CREATE POLICY "company_contracts_select" ON public."EmployeeContract"
  FOR SELECT
  TO authenticated
  USING (
    -- Users can only see contracts from their own company
    -- Join through Account table to get company isolation
    EXISTS (
      SELECT 1 
      FROM public."Account" a1
      WHERE a1.id = "EmployeeContract"."accountId"
      AND a1."companyId" = public.get_user_company_id()
    )
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_contracts_select" ON public."EmployeeContract"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read contracts from user's company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND EXISTS (
      SELECT 1 
      FROM public."Account" a1
      WHERE a1.id = "EmployeeContract"."accountId"
      AND a1."companyId" = public.get_user_company_id()
    )
  );