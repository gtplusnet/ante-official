-- CreateEnum
CREATE TYPE "EmployeeTimekeepingSourceType" AS ENUM ('MANUAL', 'COMPUTED', 'COMPUTED_MODIFIED');

-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "sourceType" "EmployeeTimekeepingSourceType" NOT NULL DEFAULT 'COMPUTED';
