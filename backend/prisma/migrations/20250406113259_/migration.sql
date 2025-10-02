/*
  Warnings:

  - You are about to drop the column `cutoffId` on the `EmployeeTimekeepingCutoff` table. All the data in the column will be lost.
  - You are about to drop the column `dateRangeCode` on the `EmployeeTimekeepingCutoff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,cutoffDateRangeId]` on the table `EmployeeTimekeepingCutoff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cutoffDateRangeId` to the `EmployeeTimekeepingCutoff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmployeeTimekeepingCutoff" DROP CONSTRAINT "EmployeeTimekeepingCutoff_cutoffId_fkey";

-- DropIndex
DROP INDEX "EmployeeTimekeepingCutoff_cutoffId_accountId_dateRangeCode_key";

-- AlterTable
ALTER TABLE "EmployeeTimekeepingCutoff" DROP COLUMN "cutoffId",
DROP COLUMN "dateRangeCode",
ADD COLUMN     "cutoffDateRangeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeepingCutoff_accountId_cutoffDateRangeId_key" ON "EmployeeTimekeepingCutoff"("accountId", "cutoffDateRangeId");

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingCutoff" ADD CONSTRAINT "EmployeeTimekeepingCutoff_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
