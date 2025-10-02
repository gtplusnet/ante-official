/*
  Warnings:

  - You are about to drop the column `isRegularHolidayPayApproved` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - You are about to drop the column `isSpecialHolidayPayApproved` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "isRegularHolidayPayApproved",
DROP COLUMN "isSpecialHolidayPayApproved";
