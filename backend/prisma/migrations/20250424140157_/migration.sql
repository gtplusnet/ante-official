-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "overrideLateMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overrideNightDifferentialMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overrideNightDifferentialOvertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overrideOvertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overrideUndertimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overrideWorkMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0;
