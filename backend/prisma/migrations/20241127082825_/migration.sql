/*
  Warnings:

  - Added the required column `roleGroupdId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedByDifficultySet" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "assignedToDifficultySet" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roleGroupdId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TaskAttachments" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedFromModule" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "uplaodedBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_roleGroupdId_fkey" FOREIGN KEY ("roleGroupdId") REFERENCES "RoleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachments" ADD CONSTRAINT "TaskAttachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachments" ADD CONSTRAINT "TaskAttachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_uplaodedBId_fkey" FOREIGN KEY ("uplaodedBId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
