-- Add missing uploadedById column to Files table as nullable
-- This column exists in schema but was missing from the database

-- AlterTable - Add as nullable column to match schema
ALTER TABLE "Files" ADD COLUMN "uploadedById" TEXT;