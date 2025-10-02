-- ============================================================================
-- AccountNotifications Table Security Rules
-- ============================================================================
-- Row Level Security policies for the AccountNotifications table
-- File: /src/security/rules/tables/account-notifications.sql
-- ============================================================================

-- Users can only read their own notifications
CREATE POLICY "users_read_own_notifications" ON public."AccountNotifications"
  FOR SELECT 
  TO authenticated
  USING (
    -- Check if the receiverId matches the authenticated user's ANTE account ID
    -- Need to map from Supabase user ID to ANTE account ID
    (
        -- For Supabase authenticated users - check if their account ID matches receiverId
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public."Account" 
            WHERE "Account"."supabaseUserId" = auth.uid()::text 
            AND "Account"."id" = "AccountNotifications"."receiverId"
        )
    )
    OR
    (
        -- For custom token-based auth (backend sets this in session)
        current_setting('app.user_id', true) = "AccountNotifications"."receiverId"
        OR
        -- Backend bypass
        current_setting('request.jwt.claim.role', true) = 'service_role'
        OR current_setting('app.source', true) = 'backend'
    )
  );