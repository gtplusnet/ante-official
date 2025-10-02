-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "isEligibleHoliday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEligibleHolidayOverride" BOOLEAN;
