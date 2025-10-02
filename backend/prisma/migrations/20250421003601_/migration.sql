/*
  Warnings:

  - You are about to drop the column `isApproved` on the `EmployeeTimekeepingLogs` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `EmployeeTimekeepingLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeepingLogs" DROP COLUMN "isApproved",
DROP COLUMN "isDeleted",
ADD COLUMN     "isRaw" BOOLEAN NOT NULL DEFAULT false;
