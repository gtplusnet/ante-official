/*
  Warnings:

  - Added the required column `branchId` to the `EmployeeData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeData" ADD COLUMN     "branchId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EmployeeData" ADD CONSTRAINT "EmployeeData_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
