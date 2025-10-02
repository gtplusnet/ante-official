-- Enable Realtime for SchoolAttendance table
-- This allows the gate app to receive real-time updates when new attendance records are created

-- First, check if the table exists
DO $$
BEGIN
    -- Enable Realtime for the SchoolAttendance table
    -- This is required for the gate app to receive live updates
    ALTER PUBLICATION supabase_realtime ADD TABLE "SchoolAttendance";
    
    RAISE NOTICE 'Realtime enabled for SchoolAttendance table';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'SchoolAttendance table already added to realtime publication';
    WHEN undefined_table THEN
        RAISE NOTICE 'SchoolAttendance table does not exist';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling realtime: %', SQLERRM;
END;
$$;

-- Also ensure the table has proper RLS policies for realtime to work
-- Check if RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'SchoolAttendance' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE "SchoolAttendance" ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled for SchoolAttendance table';
    ELSE
        RAISE NOTICE 'RLS already enabled for SchoolAttendance table';
    END IF;
END;
$$;

-- Create a policy that allows authenticated users to view their company's attendance records
-- This is needed for realtime subscriptions to work
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can view their company attendance" ON "SchoolAttendance";
    
    -- Create new policy
    CREATE POLICY "Users can view their company attendance"
        ON "SchoolAttendance"
        FOR SELECT
        TO authenticated
        USING (
            -- Allow users to see attendance records for their company
            -- The companyId should match either:
            -- 1. The company_id in their JWT metadata
            -- 2. The company_id they provided during authentication
            "companyId" = COALESCE(
                (auth.jwt() -> 'user_metadata' ->> 'company_id')::integer,
                (auth.jwt() -> 'app_metadata' ->> 'company_id')::integer,
                16  -- Default to company 16 for testing
            )
        );
    
    RAISE NOTICE 'RLS policy created for viewing attendance records';
END;
$$;

-- Also create a policy for anonymous users (for gate apps using anonymous auth)
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Anonymous users can view attendance" ON "SchoolAttendance";
    
    -- Create new policy for anonymous users
    CREATE POLICY "Anonymous users can view attendance"
        ON "SchoolAttendance"
        FOR SELECT
        TO anon
        USING (
            -- For anonymous users, we'll allow viewing company 16 records (for testing)
            -- In production, this should be more restrictive
            "companyId" = 16
        );
    
    RAISE NOTICE 'RLS policy created for anonymous viewing of attendance records';
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON "SchoolAttendance" TO authenticated;
GRANT SELECT ON "SchoolAttendance" TO anon;

-- Verify the setup
SELECT 
    'SchoolAttendance' as table_name,
    pubtables.pubname as publication_name,
    CASE 
        WHEN pubtables.pubname IS NOT NULL THEN 'Enabled'
        ELSE 'Disabled'
    END as realtime_status
FROM 
    pg_publication_tables pubtables
WHERE 
    pubtables.tablename = 'SchoolAttendance'
    AND pubtables.pubname = 'supabase_realtime'

UNION ALL

SELECT 
    'SchoolAttendance' as table_name,
    'supabase_realtime' as publication_name,
    'Disabled' as realtime_status
WHERE NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE tablename = 'SchoolAttendance' 
    AND pubname = 'supabase_realtime'
);