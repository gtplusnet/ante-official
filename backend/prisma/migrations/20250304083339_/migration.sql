/*
  Warnings:

  - Added the required column `reviewedById` to the `ProjectAccomplishment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "isForReview" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProjectAccomplishment" ADD COLUMN     "reviewedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectAccomplishment" ADD CONSTRAINT "ProjectAccomplishment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
