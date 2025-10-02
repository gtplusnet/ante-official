-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "totalCreditedHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmployeeTimekeepingCutoff" ADD COLUMN     "totalCreditedHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
