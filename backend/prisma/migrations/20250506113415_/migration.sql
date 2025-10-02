/*
  Warnings:

  - You are about to drop the column `governmentContributionSSSEEEC` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" DROP COLUMN "governmentContributionSSSEEEC",
ADD COLUMN     "governmentContributionSSSEREC" DOUBLE PRECISION NOT NULL DEFAULT 0;
