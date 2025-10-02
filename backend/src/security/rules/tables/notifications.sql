-- ============================================================================
-- Notifications Table Security Rules
-- ============================================================================
-- Row Level Security policies for the Notifications table
-- File: /src/security/rules/tables/notifications.sql
-- ============================================================================

-- Users can read notifications content
CREATE POLICY "notification_content_read" ON public."Notifications"
  FOR SELECT 
  TO authenticated
  USING (
    -- User can access notification content
    -- TODO: Add more specific filters based on notification targeting
    true
  );