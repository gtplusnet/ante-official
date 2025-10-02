-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "isAbsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRegularHoliday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRestDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpecialHoliday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nightDifferentialOvertimeApproved" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "nightDifferentialOvertimeForApproval" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtimeMinutesApproved" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtimeMinutesForApproval" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "remarks" TEXT DEFAULT '';
