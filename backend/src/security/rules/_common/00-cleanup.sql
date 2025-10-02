-- ============================================================================
-- CLEANUP: Drop all existing policies
-- ============================================================================
-- This file removes all existing RLS policies before applying new ones
-- File: /src/security/rules/_common/00-cleanup.sql
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on all tables
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;