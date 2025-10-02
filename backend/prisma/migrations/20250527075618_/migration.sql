-- CreateEnum
CREATE TYPE "PayrollFilingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "PayrollOvertimeFiling" ADD COLUMN     "status" "PayrollFilingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PayrollTimekeepingFiling" ADD COLUMN     "status" "PayrollFilingStatus" NOT NULL DEFAULT 'PENDING';
