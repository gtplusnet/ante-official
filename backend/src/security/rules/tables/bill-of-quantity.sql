-- ============================================================================
-- BillOfQuantity Table Security Rules
-- ============================================================================
-- Row Level Security policies for the BillOfQuantity table
-- File: /src/security/rules/tables/bill-of-quantity.sql
-- ============================================================================

-- Drop existing policies first (includes old naming conventions)
DROP POLICY IF EXISTS "boq_select_company" ON public."BillOfQuantity";
DROP POLICY IF EXISTS "boq_insert_company" ON public."BillOfQuantity";
DROP POLICY IF EXISTS "boq_update_company" ON public."BillOfQuantity";
DROP POLICY IF EXISTS "Users can view BOQs from their company" ON public."BillOfQuantity";
DROP POLICY IF EXISTS "Users can create BOQs for their company" ON public."BillOfQuantity";
DROP POLICY IF EXISTS "Users can update BOQs from their company" ON public."BillOfQuantity";

-- IMPORTANT: We use custom JWT authentication, NOT Supabase Auth
-- Therefore we use (auth.jwt() -> 'user_metadata' ->> 'companyId') instead of auth.uid()
-- This is intentional as our Account.id differs from Account.supabaseUserId

-- Company-filtered read policy for authenticated users via Project relationship
-- Policy name follows Supabase convention: "Subject can action object"
CREATE POLICY "Users can view BOQs from their company"
ON public."BillOfQuantity"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Check if request comes from frontend and has valid company
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "BillOfQuantity"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Frontend users can INSERT BOQs for projects in their company
CREATE POLICY "Users can create BOQs for their company"
ON public."BillOfQuantity"
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only create BOQs for projects in their company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "BillOfQuantity"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Frontend users can UPDATE BOQs from projects in their company
CREATE POLICY "Users can update BOQs from their company"
ON public."BillOfQuantity"
FOR UPDATE
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only update BOQs from projects in their company
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "BillOfQuantity"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
)
WITH CHECK (
    -- Ensure project association cannot be changed to a different company's project
    EXISTS (
      SELECT 1 FROM public."Project"
      WHERE "Project".id = "BillOfQuantity"."projectId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);

-- Also create policy for BillOfQuantityTable
DROP POLICY IF EXISTS "boq_table_select_company" ON public."BillOfQuantityTable";
DROP POLICY IF EXISTS "Users can view BOQ table items from their company" ON public."BillOfQuantityTable";

CREATE POLICY "Users can view BOQ table items from their company"
ON public."BillOfQuantityTable"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Check if X-Source header is set to frontend-main
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    AND
    -- User can only access BOQ table items from BOQs in their company
    EXISTS (
      SELECT 1 FROM public."BillOfQuantity"
      JOIN public."Project" ON "Project".id = "BillOfQuantity"."projectId"
      WHERE "BillOfQuantity".id = "BillOfQuantityTable"."billOfQuantityId"
      AND "Project"."companyId" = COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
        0
      )
    )
);