-- ============================================================================
-- ENABLE RLS on tables (except those that need RLS disabled)
-- ============================================================================
-- This file enables Row Level Security on tables in the public schema
-- Excludes tables that need RLS disabled for proper functionality
-- File: /src/security/rules/_common/01-enable-rls.sql
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
    excluded_tables TEXT[] := ARRAY[
        -- Only exclude tables that are truly shared reference data (no companyId)
        -- These tables don't need company isolation
        'RoleGroup',
        'ShiftTime'
    ];
BEGIN
    -- Enable RLS on tables except those in the exclusion list
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma%'
        AND tablename <> ALL(excluded_tables)
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;