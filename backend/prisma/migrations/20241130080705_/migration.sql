-- CreateEnum
CREATE TYPE "TaskWatcherType" AS ENUM ('CREATOR', 'ASSIGNEE', 'WATCHER');

-- AlterTable
ALTER TABLE "TaskWatcher" ADD COLUMN     "watcherType" "TaskWatcherType" NOT NULL DEFAULT 'WATCHER';
