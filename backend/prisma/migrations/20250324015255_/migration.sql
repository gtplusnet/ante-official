/*
  Warnings:

  - You are about to drop the column `processingDays` on the `Cutoff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cutoff" DROP COLUMN "processingDays",
ADD COLUMN     "releaseProcessingDays" INTEGER NOT NULL DEFAULT 3;
