/*
  Warnings:

  - You are about to drop the `TaskAttachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskAttachments" DROP CONSTRAINT "TaskAttachments_fileId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAttachments" DROP CONSTRAINT "TaskAttachments_taskId_fkey";

-- AlterTable
ALTER TABLE "Files" ADD COLUMN     "taskId" INTEGER,
ALTER COLUMN "projectId" DROP NOT NULL;

-- DropTable
DROP TABLE "TaskAttachments";

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
