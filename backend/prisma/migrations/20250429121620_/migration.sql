/*
  Warnings:

  - You are about to drop the column `isRestDayPayApproved` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "isRestDayPayApproved",
ADD COLUMN     "isDayApproved" BOOLEAN NOT NULL DEFAULT true;
