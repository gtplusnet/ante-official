/*
  Warnings:

  - You are about to drop the column `CutoffPeriodType` on the `CutoffDateRange` table. All the data in the column will be lost.
  - Added the required column `cutoffPeriodType` to the `CutoffDateRange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CutoffDateRange" DROP COLUMN "CutoffPeriodType",
ADD COLUMN     "cutoffPeriodType" "CutoffPeriodType" NOT NULL;
