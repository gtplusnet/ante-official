-- Drop all policies on the problematic tables
BEGIN;

-- Generate and execute drop statements for all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('Account', 'AccountNotifications', 'Notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
        RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

COMMIT;

-- Verify policies are dropped
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('Account', 'AccountNotifications', 'Notifications')
GROUP BY tablename;