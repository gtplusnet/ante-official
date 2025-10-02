/*
  Warnings:

  - You are about to drop the column `rateNightDifferential` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `rateNightDifferentialOvertime` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `rateOvertime` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" DROP COLUMN "rateNightDifferential",
DROP COLUMN "rateNightDifferentialOvertime",
DROP COLUMN "rateOvertime";
