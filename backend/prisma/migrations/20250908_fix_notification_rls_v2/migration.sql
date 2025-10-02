-- Fix RLS policies for notification tables to allow authenticated guardians

-- Drop all existing policies for GuardianNotification
DROP POLICY IF EXISTS "Frontend apps can read GuardianNotification data" ON "GuardianNotification";
DROP POLICY IF EXISTS "Backend can access all GuardianNotification data" ON "GuardianNotification";
DROP POLICY IF EXISTS "Authenticated users can update their own notifications" ON "GuardianNotification";
DROP POLICY IF EXISTS "Authenticated users can read GuardianNotification" ON "GuardianNotification";
DROP POLICY IF EXISTS "Authenticated users can update GuardianNotification" ON "GuardianNotification";
DROP POLICY IF EXISTS "Backend can manage GuardianNotification" ON "GuardianNotification";

-- Drop all existing policies for SchoolNotification  
DROP POLICY IF EXISTS "Frontend apps can read SchoolNotification data" ON "SchoolNotification";
DROP POLICY IF EXISTS "Backend can access all SchoolNotification data" ON "SchoolNotification";
DROP POLICY IF EXISTS "Authenticated users can update their own notifications" ON "SchoolNotification";
DROP POLICY IF EXISTS "Authenticated users can read SchoolNotification" ON "SchoolNotification";
DROP POLICY IF EXISTS "Authenticated users can update SchoolNotification" ON "SchoolNotification";
DROP POLICY IF EXISTS "Backend can manage SchoolNotification" ON "SchoolNotification";

-- Enable RLS
ALTER TABLE "GuardianNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SchoolNotification" ENABLE ROW LEVEL SECURITY;

-- Create simple policies for GuardianNotification
-- Allow all authenticated users to read GuardianNotification
-- (The Guardian App will filter by guardianId on the client side)
CREATE POLICY "authenticated_read_guardian_notifications"
ON "GuardianNotification"
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to update GuardianNotification
CREATE POLICY "authenticated_update_guardian_notifications"
ON "GuardianNotification"
FOR UPDATE
TO authenticated
USING (true);

-- Create simple policies for SchoolNotification
-- Allow all authenticated users to read SchoolNotification
CREATE POLICY "authenticated_read_school_notifications"
ON "SchoolNotification"
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to update SchoolNotification
CREATE POLICY "authenticated_update_school_notifications"
ON "SchoolNotification"
FOR UPDATE
TO authenticated
USING (true);