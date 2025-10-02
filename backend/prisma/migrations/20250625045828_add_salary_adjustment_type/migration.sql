-- AlterEnum
ALTER TYPE "SalaryAdjustmentType" ADD VALUE 'SALARY';

-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "basicPayBeforeAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;
