-- AlterTable
ALTER TABLE "EmployeeTimekeepingCutoff" ADD COLUMN     "regularHolidayCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "specialHolidayCount" DOUBLE PRECISION NOT NULL DEFAULT 0;
