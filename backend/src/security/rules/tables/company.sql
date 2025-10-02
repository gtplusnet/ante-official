-- ============================================================================
-- Company Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Company table
-- File: /src/security/rules/tables/company.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "supabase_user_own_company" ON public."Company";
DROP POLICY IF EXISTS "Users can view their own company" ON public."Company";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view their own company"
ON public."Company"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Check if request comes from frontend and has valid company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND id = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
);