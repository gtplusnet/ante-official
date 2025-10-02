/*
  Warnings:

  - You are about to drop the column `isAbsent` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "isAbsent",
ADD COLUMN     "absentCount" DOUBLE PRECISION NOT NULL DEFAULT 0;
