/*
  Warnings:

  - You are about to drop the column `dayRate` on the `EmployeeSalaryComputationPerDay` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "deductionBasisPhilhealth" "DeductionTargetBasis" NOT NULL DEFAULT 'BASIC_SALARY',
ADD COLUMN     "deductionBasisSSS" "DeductionTargetBasis" NOT NULL DEFAULT 'BASIC_SALARY',
ADD COLUMN     "deductionPeriodPagibig" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodPhilhealth" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodSSS" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodWitholdingTax" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "salaryRateType" "SalaryRateType" NOT NULL DEFAULT 'MONTHLY_RATE';

-- AlterTable
ALTER TABLE "EmployeeSalaryComputationPerDay" DROP COLUMN "dayRate",
ADD COLUMN     "cutoffRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
