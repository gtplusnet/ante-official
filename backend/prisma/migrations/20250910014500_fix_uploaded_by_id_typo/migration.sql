-- Fix typo in Files table: rename uplaodedById to uploadedById
-- The database has a typo that needs to be corrected

-- Rename the column from uplaodedById to uploadedById
ALTER TABLE "Files" RENAME COLUMN "uplaodedById" TO "uploadedById";