-- ============================================================================
-- FundTransaction Table Security Rules
-- ============================================================================
-- Row Level Security policies for the FundTransaction table
-- File: /src/security/rules/tables/fund-transaction.sql
-- ============================================================================

-- Finance role required for fund transaction access
CREATE POLICY "finance_read_fundtransaction" ON public."FundTransaction"
  FOR SELECT
  USING (
    -- Only finance role can read fund transactions
    (auth.jwt() ->> 'role')::text = 'finance'
    OR current_setting('app.user_role', true) = 'finance'
  );