-- View: accounts_without_employee_data
-- Purpose: Shows all Account records that don't have corresponding EmployeeData
-- Used by: HRIS Not Yet Setup tab
-- Created: 2024-09-06

-- Drop existing view if it exists
DROP VIEW IF EXISTS accounts_without_employee_data CASCADE;

-- Create the view with all necessary account and role information
-- Using security_invoker to respect RLS policies of the invoking user
CREATE OR REPLACE VIEW accounts_without_employee_data 
WITH (security_invoker = on) AS
SELECT 
    a.id,
    a.username,
    a.email,
    a."firstName",
    a."lastName",
    a."middleName",
    a."contactNumber",
    a.image,
    a."roleId",
    a."companyId",
    a."createdAt",
    a."updatedAt",
    
    -- Role information
    r.id as role_id,
    r.name as role_name,
    r."roleGroupId" as role_group_id,
    
    -- Role Group information  
    rg.id as rolegroup_id,
    rg.name as rolegroup_name,
    
    -- Company information (if needed)
    c.id as company_id,
    c."companyName" as company_name

FROM "Account" a
LEFT JOIN "EmployeeData" e ON e."accountId" = a.id
LEFT JOIN "Role" r ON r.id = a."roleId"
LEFT JOIN "RoleGroup" rg ON rg.id = r."roleGroupId"
LEFT JOIN "Company" c ON c.id = a."companyId"
WHERE e."accountId" IS NULL;

-- Grant appropriate permissions for Supabase RLS
GRANT SELECT ON accounts_without_employee_data TO anon, authenticated;

-- Add comment to the view for documentation
COMMENT ON VIEW accounts_without_employee_data IS 'View containing all Account records that do not have corresponding EmployeeData entries. Used by the HRIS Not Yet Setup tab to show accounts that need employee setup.';