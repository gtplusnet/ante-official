-- ============================================================================
-- Security Helper Functions
-- ============================================================================
-- Functions to support RLS policies without creating recursion
-- File: /src/security/rules/_functions/get-user-company.sql
-- ============================================================================

-- Function to get current user's company ID from JWT
-- This avoids recursive queries in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Extract companyId from JWT user_metadata
  -- The JWT structure has user_metadata as a nested object
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
    0
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;