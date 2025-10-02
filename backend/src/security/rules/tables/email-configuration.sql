-- ============================================================================
-- EmailConfiguration Table Security Rules
-- ============================================================================
-- Row Level Security policies for the EmailConfiguration table
-- File: /src/security/rules/tables/email-configuration.sql
-- ============================================================================

-- Admin-only access to email configuration
CREATE POLICY "admin_only_emailconfig" ON public."EmailConfiguration"
  FOR ALL
  USING (
    -- Only admin role can access email configuration
    (auth.jwt() ->> 'role')::text = 'admin'
    OR current_setting('app.user_role', true) = 'admin'
  );