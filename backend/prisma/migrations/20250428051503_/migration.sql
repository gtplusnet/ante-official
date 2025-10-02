/*
  Warnings:

  - A unique constraint covering the columns `[timekeepingId]` on the table `EmployeeTimekeepingOverride` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timekeepingId` to the `EmployeeTimekeepingOverride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeepingOverride" ADD COLUMN     "timekeepingId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeepingOverride_timekeepingId_key" ON "EmployeeTimekeepingOverride"("timekeepingId");
