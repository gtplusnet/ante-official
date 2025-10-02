-- AlterTable
ALTER TABLE "QueueLogs" ADD COLUMN     "params" JSONB NOT NULL DEFAULT '{}';
