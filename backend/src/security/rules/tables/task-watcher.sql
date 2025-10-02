-- ============================================================================
-- TaskWatcher Table Security Rules
-- ============================================================================
-- Row Level Security policies for the TaskWatcher table
-- SECURE: RLS enabled with proper authentication
-- File: /src/security/rules/tables/task-watcher.sql
-- ============================================================================

-- User-based access: Users can view task watchers they're part of
CREATE POLICY "user_task_watchers_select" ON public."TaskWatcher"
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see watchers if:
    -- 1. They are the watcher themselves
    "TaskWatcher"."accountId" = auth.uid()::text
    OR
    -- 2. They have access to the task (without recursive check)
    EXISTS (
      SELECT 1 FROM public."Task" t
      WHERE t.id = "TaskWatcher"."taskId"
      AND (
        t."assignedToId" = auth.uid()::text
        OR
        t."createdById" = auth.uid()::text
        OR
        EXISTS (
          SELECT 1 FROM public."Project" p
          WHERE p.id = t."projectId"
          AND p."companyId" = public.get_user_company_id()
        )
      )
    )
  );

-- Frontend read-only access with X-Source header
CREATE POLICY "frontend_task_watchers_select" ON public."TaskWatcher"
  FOR SELECT
  TO authenticated
  USING (
    -- Frontend can read task watchers following same rules
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND (
      -- 1. They are the watcher themselves
      "TaskWatcher"."accountId" = auth.uid()::text
      OR
      -- 2. They have access to the task (without recursive check)
      EXISTS (
        SELECT 1 FROM public."Task" t
        WHERE t.id = "TaskWatcher"."taskId"
        AND (
          t."assignedToId" = auth.uid()::text
          OR
          t."createdById" = auth.uid()::text
          OR
          EXISTS (
            SELECT 1 FROM public."Project" p
            WHERE p.id = t."projectId"
            AND p."companyId" = public.get_user_company_id()
          )
        )
      )
    )
  );