-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('REST_DAY', 'EXTRA_DAY', 'TIME_BOUND', 'FLEXITIME');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "shiftType" "ShiftType" NOT NULL DEFAULT 'TIME_BOUND';
