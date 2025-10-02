/*
  Warnings:

  - You are about to drop the `projectAccomplishment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "projectAccomplishment" DROP CONSTRAINT "projectAccomplishment_attachmentId_fkey";

-- DropForeignKey
ALTER TABLE "projectAccomplishment" DROP CONSTRAINT "projectAccomplishment_projectId_fkey";

-- DropTable
DROP TABLE "projectAccomplishment";

-- CreateTable
CREATE TABLE "ProjectAccomplishment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attachmentId" INTEGER,
    "accomplishmentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAccomplishment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectAccomplishment" ADD CONSTRAINT "ProjectAccomplishment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAccomplishment" ADD CONSTRAINT "ProjectAccomplishment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
