-- Drop the old unique constraint that applies to ALL records
DROP INDEX IF EXISTS "PointOfContact_email_companyId_key";

-- Create a partial unique index that only applies to ACTIVE contacts
-- This allows archived/deleted contacts to have duplicate emails
CREATE UNIQUE INDEX "PointOfContact_email_companyId_active_key"
ON "PointOfContact"("email", "companyId")
WHERE "isActive" = true;
