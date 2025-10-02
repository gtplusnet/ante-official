-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "workDayCount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmployeeTimekeepingCutoff" ADD COLUMN     "workDayCount" DOUBLE PRECISION NOT NULL DEFAULT 0;
