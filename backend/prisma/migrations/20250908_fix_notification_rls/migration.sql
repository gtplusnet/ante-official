-- Fix RLS policies for GuardianNotification and SchoolNotification tables
-- Allow all authenticated users to access these tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Frontend apps can read GuardianNotification data" ON "GuardianNotification";
DROP POLICY IF EXISTS "Backend can access all GuardianNotification data" ON "GuardianNotification";
DROP POLICY IF EXISTS "Authenticated users can update their own notifications" ON "GuardianNotification";
DROP POLICY IF EXISTS "Frontend apps can read SchoolNotification data" ON "SchoolNotification";
DROP POLICY IF EXISTS "Backend can access all SchoolNotification data" ON "SchoolNotification";
DROP POLICY IF EXISTS "Authenticated users can update their own notifications" ON "SchoolNotification";

-- Enable RLS on tables if not already enabled
ALTER TABLE "GuardianNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SchoolNotification" ENABLE ROW LEVEL SECURITY;

-- Create new policies for GuardianNotification
CREATE POLICY "Authenticated users can read GuardianNotification"
ON "GuardianNotification"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update GuardianNotification"
ON "GuardianNotification"
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Backend can manage GuardianNotification"
ON "GuardianNotification"
FOR ALL
TO authenticated
USING (
  COALESCE(current_setting('app.source', true), '') = 'backend'
);

-- Create new policies for SchoolNotification  
CREATE POLICY "Authenticated users can read SchoolNotification"
ON "SchoolNotification"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update SchoolNotification"
ON "SchoolNotification"
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Backend can manage SchoolNotification"
ON "SchoolNotification"
FOR ALL
TO authenticated
USING (
  COALESCE(current_setting('app.source', true), '') = 'backend'
);