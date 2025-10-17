-- AlterTable
ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Backfill completedAt for existing completed tasks
-- Set completedAt to updatedAt for tasks that are currently in DONE lane
UPDATE "Task" 
SET "completedAt" = "updatedAt" 
WHERE "boardLaneId" IN (
  SELECT id FROM "BoardLane" WHERE key = 'DONE'
) 
AND "completedAt" IS NULL;

