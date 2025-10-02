-- CreateEnum
CREATE TYPE "TimekeepingSource" AS ENUM ('MANUAL', 'SYSTEM', 'BIOMETRICS');

-- AlterTable
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN     "source" "TimekeepingSource" NOT NULL DEFAULT 'MANUAL';
