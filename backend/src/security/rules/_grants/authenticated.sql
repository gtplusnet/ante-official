-- ============================================================================
-- GRANT statements for authenticated role
-- ============================================================================
-- This file contains all GRANT permissions for authenticated users
-- File: /src/security/rules/_grants/authenticated.sql
-- ============================================================================

-- Grant SELECT permissions to authenticated users on HRIS tables
GRANT SELECT ON public."EmployeeData" TO authenticated;
GRANT SELECT ON public."Account" TO authenticated;
GRANT SELECT ON public."EmployeeContract" TO authenticated;
GRANT SELECT ON public."Project" TO authenticated;
GRANT UPDATE ON public."Project" TO authenticated;  -- Added for drag-and-drop functionality in board view
GRANT SELECT ON public."Role" TO authenticated;
GRANT SELECT ON public."RoleGroup" TO authenticated;
GRANT SELECT ON public."PayrollGroup" TO authenticated;
GRANT SELECT ON public."Schedule" TO authenticated;
GRANT SELECT ON public."Shift" TO authenticated;
GRANT SELECT ON public."ShiftTime" TO authenticated;

-- Grant permissions on Company table
GRANT SELECT ON public."Company" TO authenticated;

-- Grant permissions on Client and Location tables (needed for Project relationships)
GRANT SELECT ON public."Client" TO authenticated;
GRANT SELECT ON public."Location" TO authenticated;
GRANT SELECT ON public."BillOfQuantity" TO authenticated;

-- Grant permissions on Task and ApprovalMetadata tables
GRANT SELECT ON public."Task" TO authenticated;
GRANT UPDATE ON public."Task" TO authenticated;  -- Added for task phase drag-and-drop
GRANT INSERT ON public."Task" TO authenticated;  -- Added for quick task creation
GRANT USAGE, SELECT ON SEQUENCE public."Task_id_seq" TO authenticated;  -- For auto-increment on INSERT
GRANT SELECT ON public."ApprovalMetadata" TO authenticated;

-- Grant permissions on TaskPhase table
GRANT SELECT, INSERT, UPDATE ON public."TaskPhase" TO authenticated;