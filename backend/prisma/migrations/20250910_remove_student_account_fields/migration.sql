-- Remove account-related fields from Student table
ALTER TABLE "Student" 
DROP COLUMN IF EXISTS "email",
DROP COLUMN IF EXISTS "password",
DROP COLUMN IF EXISTS "username",
DROP COLUMN IF EXISTS "key",
DROP COLUMN IF EXISTS "lastLogin",
DROP COLUMN IF EXISTS "locationId";