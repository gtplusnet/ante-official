/*
  Warnings:

  - You are about to drop the column `isDayApproved` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "isDayApproved",
ADD COLUMN     "isRegularHolidayPayApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRestDayPayApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpecialHolidayPayApproved" BOOLEAN NOT NULL DEFAULT false;
