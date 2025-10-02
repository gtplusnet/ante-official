/*
  Warnings:

  - You are about to drop the column `lateUndertimeMinutes` on the `EmployeeTimekeeping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "lateUndertimeMinutes",
ADD COLUMN     "lateMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "undertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0;
