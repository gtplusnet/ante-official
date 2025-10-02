-- AlterTable
ALTER TABLE "LeavePlan" ADD COLUMN     "consecutiveFilingDays" INTEGER,
ADD COLUMN     "isLimitedConsecutiveFilingDays" BOOLEAN NOT NULL DEFAULT false;
