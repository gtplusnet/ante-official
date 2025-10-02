-- ============================================================================
-- CREATE BYPASS POLICY for superuser (so migrations still work)
-- ============================================================================
-- This file creates superuser bypass policies for all tables
-- File: /src/security/rules/_common/02-bypass-superuser.sql
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Create bypass policy for each table
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma%'
    LOOP
        -- Superuser bypass (for migrations and admin)
        EXECUTE format('
            CREATE POLICY "bypass_rls_%s" ON public.%I
            FOR ALL
            USING (
                -- Check Supabase JWT role for service_role
                (auth.jwt() ->> ''role'')::text = ''service_role''
                OR
                -- Legacy check for custom settings
                current_setting(''request.jwt.claim.role'', true) = ''service_role''
                OR current_user = ''postgres''
                OR current_user LIKE ''%%postgres%%''
            )', 
            r.tablename, r.tablename);
    END LOOP;
END $$;