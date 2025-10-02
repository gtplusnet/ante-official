-- CreateEnum
CREATE TYPE "EmployeeSalaryComputationStage" AS ENUM ('PENDING', 'COMPUTED', 'FOR_APPROVAL', 'APPROVED', 'RELEASED');

-- CreateTable
CREATE TABLE "EmployeeSalaryComputation" (
    "employeeTimekeepingCutoffId" INTEGER NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionLate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionUndertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionAbsent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionSalaryAdjustmnt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsNightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsSpecialHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsRegularHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsSalaryAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningsPlusAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "governmentContributionSSS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "governmentContributionPhilhealth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "governmentContributionPagibig" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "governmentContributionTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGovernmentContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loans" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateNightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateNightDifferentialOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basicPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "EmployeeSalaryComputation_pkey" PRIMARY KEY ("employeeTimekeepingCutoffId")
);

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputation" ADD CONSTRAINT "EmployeeSalaryComputation_employeeTimekeepingCutoffId_fkey" FOREIGN KEY ("employeeTimekeepingCutoffId") REFERENCES "EmployeeTimekeepingCutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
