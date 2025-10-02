-- ============================================================================
-- Shift Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Shift table
-- SECURE: RLS enabled with proper authentication and company isolation
-- File: /src/security/rules/tables/shift.sql
-- ============================================================================

-- Company-based access: Users can view shifts from their company
CREATE POLICY "company_shifts_select" ON public."Shift"
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can only see shifts from their own company
    -- Use helper function to avoid recursion
    "companyId" = public.get_user_company_id()
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_shifts_select" ON public."Shift"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read shifts from user's company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = public.get_user_company_id()
  );