/*
  Warnings:

  - Added the required column `scheduleId` to the `EmployeeData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeData" ADD COLUMN     "scheduleId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EmployeeData" ADD CONSTRAINT "EmployeeData_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
