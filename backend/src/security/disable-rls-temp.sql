-- Temporarily disable RLS for testing
-- WARNING: This should only be used for testing and debugging!

BEGIN;

-- Disable RLS on the critical tables
ALTER TABLE public."Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountNotifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notifications" DISABLE ROW LEVEL SECURITY;

-- Keep other tables with RLS enabled
-- This allows basic functionality while we debug the auth issues

COMMIT;

-- Show status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: RLS temporarily disabled for testing';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with RLS disabled:';
    RAISE NOTICE '  - Account';
    RAISE NOTICE '  - AccountNotifications';
    RAISE NOTICE '  - Notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember to re-enable RLS after testing!';
    RAISE NOTICE '========================================';
END $$;