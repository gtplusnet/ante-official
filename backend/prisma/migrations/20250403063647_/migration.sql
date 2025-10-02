/*
  Warnings:

  - You are about to drop the column `timekeepingCategory` on the `EmployeeTimekeepingLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeepingLogs" DROP COLUMN "timekeepingCategory";

-- DropEnum
DROP TYPE "TimekeepingCategory";
