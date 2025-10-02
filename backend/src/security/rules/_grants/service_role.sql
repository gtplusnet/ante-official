-- ============================================================================
-- GRANT statements for service_role
-- ============================================================================
-- This file contains all GRANT permissions for service_role
-- Service role should have full access to bypass RLS for admin operations
-- File: /src/security/rules/_grants/service_role.sql
-- ============================================================================

-- Grant ALL permissions to service_role on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma%'
    LOOP
        EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
    END LOOP;
END $$;

-- Grant usage on sequences
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('GRANT ALL ON SEQUENCE public.%I TO service_role', r.sequence_name);
    END LOOP;
END $$;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;