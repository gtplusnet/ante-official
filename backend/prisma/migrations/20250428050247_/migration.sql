/*
  Warnings:

  - You are about to drop the column `overrideLateMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `overrideNightDifferentialMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `overrideNightDifferentialOvertimeMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `overrideOvertimeMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `overrideUndertimeMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `overrideWorkMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `employeeTimekeepingId` on the `EmployeeTimekeepingOverride` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmployeeTimekeepingOverride" DROP CONSTRAINT "EmployeeTimekeepingOverride_employeeTimekeepingId_fkey";

-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "overrideLateMinutes",
DROP COLUMN "overrideNightDifferentialMinutes",
DROP COLUMN "overrideNightDifferentialOvertimeMinutes",
DROP COLUMN "overrideOvertimeMinutes",
DROP COLUMN "overrideUndertimeMinutes",
DROP COLUMN "overrideWorkMinutes",
ADD COLUMN     "overrideId" INTEGER;

-- AlterTable
ALTER TABLE "EmployeeTimekeepingOverride" DROP COLUMN "employeeTimekeepingId";

-- AddForeignKey
ALTER TABLE "EmployeeTimekeeping" ADD CONSTRAINT "EmployeeTimekeeping_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "EmployeeTimekeepingOverride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
