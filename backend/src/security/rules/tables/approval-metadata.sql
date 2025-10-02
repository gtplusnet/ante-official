-- ============================================================================
-- ApprovalMetadata Table Security Rules
-- ============================================================================
-- Row Level Security policies for the ApprovalMetadata table
-- Company-based filtering through Task table relationship
-- Uses JWT user_metadata.companyId for access control
-- File: /src/security/rules/tables/approval-metadata.sql
-- ============================================================================

-- Enable RLS
ALTER TABLE "ApprovalMetadata" ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "frontend_select_approval_metadata" ON "ApprovalMetadata";
DROP POLICY IF EXISTS "backend_all_approval_metadata" ON "ApprovalMetadata";
DROP POLICY IF EXISTS "approval_metadata_select_company_filtered" ON "ApprovalMetadata";
DROP POLICY IF EXISTS "approval_metadata_select_all" ON "ApprovalMetadata";
DROP POLICY IF EXISTS "approval_metadata_select_authenticated" ON "ApprovalMetadata";
DROP POLICY IF EXISTS "Users can view approval metadata for tasks in their company" ON public."ApprovalMetadata";

-- Company-filtered read policy for authenticated users
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view approval metadata for tasks in their company"
ON public."ApprovalMetadata"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Check if request comes from frontend and has valid company
  current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
  AND EXISTS (
    SELECT 1 FROM public."Task"
    WHERE "Task".id = "ApprovalMetadata"."taskId"
    AND "Task"."companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  )
);

-- Note: We intentionally DO NOT add INSERT/UPDATE/DELETE policies
-- All write operations must go through the backend API to ensure:
-- 1. Business logic validation
-- 2. Audit trail creation
-- 3. Complex permission checks
-- 4. Task status synchronization
-- 5. Approval chain integrity

-- Add helpful comment
COMMENT ON TABLE "ApprovalMetadata" IS 'Stores metadata for approval tasks including source module, approval chain, and actions';