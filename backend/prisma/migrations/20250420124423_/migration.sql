/*
  Warnings:

  - You are about to drop the column `isRegularHoliday` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `isSpecialHoliday` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "isRegularHoliday",
DROP COLUMN "isSpecialHoliday",
ADD COLUMN     "isExtraDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regularHolidayCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "specialHolidayCount" DOUBLE PRECISION NOT NULL DEFAULT 0;
