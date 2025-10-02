-- ============================================================================
-- EmployeeData Table Security Rules
-- ============================================================================
-- Row Level Security policies for the EmployeeData table
-- Uses JWT user_metadata for company-based filtering
-- File: /src/security/rules/tables/employee-data.sql
-- ============================================================================

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "company_employees_select" ON public."EmployeeData";
DROP POLICY IF EXISTS "frontend_employees_select" ON public."EmployeeData";
DROP POLICY IF EXISTS "users_own_employee_data" ON public."EmployeeData";
DROP POLICY IF EXISTS "Users can view employee data from their company" ON public."EmployeeData";

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view employee data from their company"
ON public."EmployeeData"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check if request comes from frontend and has valid company
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1
    FROM public."Account" a1
    WHERE a1.id = "EmployeeData"."accountId"
    AND a1."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- Note: We intentionally DO NOT add INSERT/UPDATE/DELETE policies
-- All write operations must go through the backend API to ensure:
-- 1. Business logic validation
-- 2. Employee code generation
-- 3. Audit trail creation
-- 4. Department and shift assignment validation
-- 5. Biometric data synchronization