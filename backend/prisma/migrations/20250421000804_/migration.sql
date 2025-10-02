-- CreateEnum
CREATE TYPE "ActiveShiftType" AS ENUM ('NONE', 'REGULAR_SHIFT', 'MANUAL_SCHEDULE', 'SCHEDULE_ADJUSTMENT');

-- AlterTable
ALTER TABLE "EmployeeTimekeeping" ADD COLUMN     "activeShiftConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "activeShiftType" "ActiveShiftType" NOT NULL DEFAULT 'NONE';
