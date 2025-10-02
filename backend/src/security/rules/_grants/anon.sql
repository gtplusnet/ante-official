-- ============================================================================
-- GRANT statements for anonymous role  
-- ============================================================================
-- This file contains all GRANT permissions for anonymous users
-- SECURE: No anonymous access to sensitive data - all access requires authentication
-- File: /src/security/rules/_grants/anon.sql
-- ============================================================================

-- Anonymous users have NO access to sensitive tables
-- All data access now requires proper authentication through Supabase
-- Company data is protected and only accessible to authenticated users

-- No grants for anonymous users - security by default