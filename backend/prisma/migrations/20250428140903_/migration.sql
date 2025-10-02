-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "breakMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmployeeTimekeepingCutoff" ADD COLUMN     "breakMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0;
