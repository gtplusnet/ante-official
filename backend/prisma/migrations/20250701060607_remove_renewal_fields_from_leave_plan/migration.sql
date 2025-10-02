/*
  Warnings:

  - You are about to drop the column `customRenewalDate` on the `LeavePlan` table. All the data in the column will be lost.
  - You are about to drop the column `renewalType` on the `LeavePlan` table. All the data in the column will be lost.
  - You are about to drop the column `workingDaysPerMonth` on the `LeavePlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeavePlan" DROP COLUMN "customRenewalDate",
DROP COLUMN "renewalType",
DROP COLUMN "workingDaysPerMonth";
