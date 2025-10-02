-- ============================================================================
-- Account Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Account table
-- Uses JWT user_metadata for company-based filtering
-- File: /src/security/rules/tables/account.sql
-- ============================================================================

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "authenticated_company_accounts" ON public."Account";
DROP POLICY IF EXISTS "frontend_accounts_select" ON public."Account";
DROP POLICY IF EXISTS "account_select_permissive" ON public."Account";
DROP POLICY IF EXISTS "Users can view accounts from their company" ON public."Account";

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view accounts from their company"
ON public."Account"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check if request comes from frontend and has valid company
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND "companyId" = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  )
);

-- Note: We intentionally DO NOT add INSERT/UPDATE/DELETE policies
-- All write operations must go through the backend API to ensure:
-- 1. Password hashing and security
-- 2. Token generation and management
-- 3. Role assignment validation
-- 4. Audit trail creation
-- 5. Multi-account coordination