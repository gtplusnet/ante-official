-- Temporary simplified RLS policies for testing
BEGIN;

-- Drop existing policies on Account table
DROP POLICY IF EXISTS "bypass_rls_Account" ON public."Account";
DROP POLICY IF EXISTS "frontend_read_Account" ON public."Account";
DROP POLICY IF EXISTS "supabase_user_own_account" ON public."Account";
DROP POLICY IF EXISTS "backend_insert_Account" ON public."Account";
DROP POLICY IF EXISTS "backend_update_Account" ON public."Account";
DROP POLICY IF EXISTS "backend_delete_Account" ON public."Account";

-- Create a simple policy that allows authenticated users to read their own account
CREATE POLICY "authenticated_users_read_own_account" ON public."Account"
    FOR SELECT
    USING (
        -- Allow if authenticated and supabaseUserId matches
        auth.uid()::text = "supabaseUserId"
    );

-- Create service role bypass
CREATE POLICY "service_role_all_Account" ON public."Account"
    FOR ALL
    USING (auth.role() = 'service_role');

-- Drop existing policies on AccountNotifications table
DROP POLICY IF EXISTS "users_read_own_notifications" ON public."AccountNotifications";
DROP POLICY IF EXISTS "bypass_rls_AccountNotifications" ON public."AccountNotifications";
DROP POLICY IF EXISTS "frontend_read_AccountNotifications" ON public."AccountNotifications";
DROP POLICY IF EXISTS "backend_insert_AccountNotifications" ON public."AccountNotifications";
DROP POLICY IF EXISTS "backend_update_AccountNotifications" ON public."AccountNotifications";
DROP POLICY IF EXISTS "backend_delete_AccountNotifications" ON public."AccountNotifications";

-- Create simple policy for notifications
CREATE POLICY "authenticated_users_read_own_notifications" ON public."AccountNotifications"
    FOR SELECT
    USING (
        -- Allow if user owns the account that owns the notification
        EXISTS (
            SELECT 1 FROM public."Account"
            WHERE "Account"."id" = "AccountNotifications"."receiverId"
            AND "Account"."supabaseUserId" = auth.uid()::text
        )
    );

-- Service role bypass for notifications
CREATE POLICY "service_role_all_AccountNotifications" ON public."AccountNotifications"
    FOR ALL
    USING (auth.role() = 'service_role');

-- Drop existing policies on Notifications table
DROP POLICY IF EXISTS "notification_content_read" ON public."Notifications";
DROP POLICY IF EXISTS "bypass_rls_Notifications" ON public."Notifications";
DROP POLICY IF EXISTS "frontend_read_Notifications" ON public."Notifications";
DROP POLICY IF EXISTS "backend_insert_Notifications" ON public."Notifications";
DROP POLICY IF EXISTS "backend_update_Notifications" ON public."Notifications";
DROP POLICY IF EXISTS "backend_delete_Notifications" ON public."Notifications";

-- Create simple policy for notification content
CREATE POLICY "authenticated_read_linked_notifications" ON public."Notifications"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."AccountNotifications"
            WHERE "AccountNotifications"."notificationsId" = "Notifications"."id"
            AND EXISTS (
                SELECT 1 FROM public."Account"
                WHERE "Account"."id" = "AccountNotifications"."receiverId"
                AND "Account"."supabaseUserId" = auth.uid()::text
            )
        )
    );

-- Service role bypass for notification content
CREATE POLICY "service_role_all_Notifications" ON public."Notifications"
    FOR ALL
    USING (auth.role() = 'service_role');

COMMIT;

-- Show summary
DO $$
BEGIN
    RAISE NOTICE 'Simplified RLS policies applied for testing';
    RAISE NOTICE 'Authenticated users can read their own data';
    RAISE NOTICE 'Service role has full access';
END $$;