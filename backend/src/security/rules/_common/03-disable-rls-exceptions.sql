-- ============================================================================
-- DISABLE RLS for specific tables that need it disabled
-- ============================================================================
-- This file disables Row Level Security on specific tables that need it
-- This runs AFTER policies are created to ensure proper functionality
-- File: /src/security/rules/_common/03-disable-rls-exceptions.sql
-- ============================================================================

DO $$ 
DECLARE
    tables_to_disable TEXT[] := ARRAY[
        -- Only disable RLS on tables that are truly shared reference data (no companyId)
        -- These tables don't need company isolation
        'RoleGroup',
        'ShiftTime'
    ];
    table_name TEXT;
BEGIN
    -- Disable RLS on specific tables
    FOREACH table_name IN ARRAY tables_to_disable
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS disabled for table: %', table_name;
    END LOOP;
END $$;