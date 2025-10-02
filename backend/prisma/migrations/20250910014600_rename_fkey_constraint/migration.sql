-- Rename foreign key constraint to match the corrected column name
-- The constraint still has the old typo in its name

-- Drop old constraint
ALTER TABLE "Files" DROP CONSTRAINT "Files_uplaodedById_fkey";

-- Add new constraint with correct name
ALTER TABLE "Files" ADD CONSTRAINT "Files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Account"("id") ON UPDATE CASCADE ON DELETE CASCADE;