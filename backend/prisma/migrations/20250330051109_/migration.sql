-- AlterTable
ALTER TABLE "Queue" ADD COLUMN     "queueSettings" JSONB NOT NULL DEFAULT '{}';
