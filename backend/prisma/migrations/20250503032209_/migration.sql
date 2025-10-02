-- CreateTable
CREATE TABLE "EmployeeSalaryComputationPerDay" (
    "timekeepingId" INTEGER NOT NULL,
    "dayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateNightDifferntial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateNightDifferentialOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateRegularHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateSpecialHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionLate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionUndertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningOvertimeRaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningNightDifferentialRaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningNightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningNightDifferentialOvertimeRaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningNightDifferentialOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningRegularHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningSpecialHolidayRaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earningSpecialHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAdditionalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basicPay" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "EmployeeSalaryComputationPerDay_pkey" PRIMARY KEY ("timekeepingId")
);

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationPerDay" ADD CONSTRAINT "EmployeeSalaryComputationPerDay_timekeepingId_fkey" FOREIGN KEY ("timekeepingId") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
