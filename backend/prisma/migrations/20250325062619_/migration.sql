-- CreateEnum
CREATE TYPE "SalaryRateType" AS ENUM ('DAILY_RATE', 'FIXED_RATE', 'MONTHLY_RATE');

-- CreateEnum
CREATE TYPE "DeductionPeriod" AS ENUM ('FIRST_PERIOD', 'SECOND_PERIOD', 'EVERY_PERIOD', 'NOT_DEDUCTED');

-- CreateEnum
CREATE TYPE "deductionType" AS ENUM ('BASED_ON_SALARY', 'NOT_DEDUCTED', 'CUSTOM');

-- CreateTable
CREATE TABLE "PayrollGroup" (
    "id" SERIAL NOT NULL,
    "payrollGroupCode" TEXT NOT NULL,
    "cutoffId" INTEGER NOT NULL,
    "salaryRateType" "SalaryRateType" NOT NULL,
    "deductionBasisWitholdingTax" "DeductionPeriod" NOT NULL,
    "deductionBasisSSS" "DeductionPeriod" NOT NULL,
    "deductionBasisPhilHealth" "DeductionPeriod" NOT NULL,
    "deductionBasisPagibig" "DeductionPeriod" NOT NULL,
    "deductionBasisPhic" "DeductionPeriod" NOT NULL,
    "lateDeductionType" "deductionType" NOT NULL,
    "lateDeductionCustom" JSONB NOT NULL DEFAULT '{}',
    "undertimeDeductionType" "deductionType" NOT NULL,
    "undertimeDeductionCustom" JSONB NOT NULL DEFAULT '{}',
    "absentDeductionHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shiftingWorkingDaysPerWeek" INTEGER NOT NULL DEFAULT 6,
    "lateGraceTimeMinutes" DOUBLE PRECISION NOT NULL,
    "undertimeGraceTimeMinutes" DOUBLE PRECISION NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overtimeRateFactors" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PayrollGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollGroup_payrollGroupCode_key" ON "PayrollGroup"("payrollGroupCode");

-- AddForeignKey
ALTER TABLE "PayrollGroup" ADD CONSTRAINT "PayrollGroup_cutoffId_fkey" FOREIGN KEY ("cutoffId") REFERENCES "Cutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
