/*
  Warnings:

  - You are about to drop the column `earningsNightDifferential` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `earningsOvertime` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `earningsRegularHoliday` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `earningsSalaryAdjustment` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `earningsSpecialHoliday` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarnings` on the `EmployeeSalaryComputation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" DROP COLUMN "earningsNightDifferential",
DROP COLUMN "earningsOvertime",
DROP COLUMN "earningsRegularHoliday",
DROP COLUMN "earningsSalaryAdjustment",
DROP COLUMN "earningsSpecialHoliday",
DROP COLUMN "totalEarnings",
ADD COLUMN     "earningNightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "earningOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "earningRegularHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "earningRestDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "earningSalaryAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "earningSpecialHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAdditionalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmployeeSalaryComputationPerDay" ADD COLUMN     "earningRestDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rateRestDay" DOUBLE PRECISION NOT NULL DEFAULT 0;
