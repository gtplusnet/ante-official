-- CreateTable
CREATE TABLE "EmployeeTimekeepingOverride" (
    "id" SERIAL NOT NULL,
    "employeeTimekeepingId" INTEGER NOT NULL,
    "workMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "undertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferentialOvertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "EmployeeTimekeepingOverride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingOverride" ADD CONSTRAINT "EmployeeTimekeepingOverride_employeeTimekeepingId_fkey" FOREIGN KEY ("employeeTimekeepingId") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
