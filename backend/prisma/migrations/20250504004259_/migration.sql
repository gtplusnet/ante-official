-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmployeeSalaryComputationPerDay" ADD COLUMN     "deductionAbsent" DOUBLE PRECISION NOT NULL DEFAULT 0;
