-- ============================================================================
-- AccountToken Table Security Rules
-- ============================================================================
-- Row Level Security policies for the AccountToken table
-- File: /src/security/rules/tables/account-token.sql
-- ============================================================================

-- No frontend access to AccountToken at all (security-sensitive)
CREATE POLICY "no_frontend_accounttoken" ON public."AccountToken"
  FOR ALL
  USING (
    -- Frontend sources cannot access AccountToken table
    NOT (current_setting('app.source', true) IN ('frontend-main', 'frontend-gate', 'frontend-guardian'))
  );