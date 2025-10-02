/*
  Warnings:

  - You are about to drop the column `rateNightDifferntial` on the `EmployeeSalaryComputationPerDay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputationPerDay" DROP COLUMN "rateNightDifferntial",
ADD COLUMN     "rateNightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0;
