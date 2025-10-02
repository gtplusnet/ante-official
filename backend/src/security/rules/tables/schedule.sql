-- ============================================================================
-- Schedule Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Schedule table
-- SECURE: RLS enabled with proper authentication and company isolation
-- File: /src/security/rules/tables/schedule.sql
-- ============================================================================

-- Company-based access: Users can view schedules from their company
CREATE POLICY "company_schedules_select" ON public."Schedule"
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can only see schedules from their own company
    -- Use helper function to avoid recursion
    "companyId" = public.get_user_company_id()
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_schedules_select" ON public."Schedule"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read schedules from user's company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND "companyId" = public.get_user_company_id()
  );