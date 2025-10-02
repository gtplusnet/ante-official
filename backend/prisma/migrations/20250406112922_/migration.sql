/*
  Warnings:

  - Added the required column `cutoffId` to the `CutoffDateRange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CutoffDateRange" ADD COLUMN     "cutoffId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "CutoffDateRange" ADD CONSTRAINT "CutoffDateRange_cutoffId_fkey" FOREIGN KEY ("cutoffId") REFERENCES "Cutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
