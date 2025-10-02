/*
  Warnings:

  - Added the required column `activeContractId` to the `EmployeeData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EmployeeData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeData" ADD COLUMN     "activeContractId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "PayrollSalaryIntervalType";

-- AddForeignKey
ALTER TABLE "EmployeeData" ADD CONSTRAINT "EmployeeData_activeContractId_fkey" FOREIGN KEY ("activeContractId") REFERENCES "EmployeeContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
