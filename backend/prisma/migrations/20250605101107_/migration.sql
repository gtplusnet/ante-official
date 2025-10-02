/*
  Warnings:

  - You are about to drop the column `governmentContributionSSSBasisrevious` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" DROP COLUMN "governmentContributionSSSBasisrevious",
ADD COLUMN     "governmentContributionSSSBasisPrevious" DOUBLE PRECISION NOT NULL DEFAULT 0;
