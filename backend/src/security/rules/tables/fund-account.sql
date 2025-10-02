-- ============================================================================
-- FundAccount Table Security Rules
-- ============================================================================
-- Row Level Security policies for the FundAccount table
-- File: /src/security/rules/tables/fund-account.sql
-- ============================================================================

-- Finance role required for fund account access
CREATE POLICY "finance_read_fundaccount" ON public."FundAccount"
  FOR SELECT
  USING (
    -- Only finance role can read fund accounts
    (auth.jwt() ->> 'role')::text = 'finance'
    OR current_setting('app.user_role', true) = 'finance'
  );