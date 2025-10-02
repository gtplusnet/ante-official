/*
  Warnings:

  - You are about to drop the `PayrollOvertimeFiling` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PayrollTimekeepingFiling` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "PayrollFilingType" ADD VALUE 'OVERTIME';

-- DropForeignKey
ALTER TABLE "PayrollOvertimeFiling" DROP CONSTRAINT "PayrollOvertimeFiling_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollOvertimeFiling" DROP CONSTRAINT "PayrollOvertimeFiling_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "PayrollTimekeepingFiling" DROP CONSTRAINT "PayrollTimekeepingFiling_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollTimekeepingFiling" DROP CONSTRAINT "PayrollTimekeepingFiling_approvedById_fkey";

-- DropTable
DROP TABLE "PayrollOvertimeFiling";

-- DropTable
DROP TABLE "PayrollTimekeepingFiling";

-- CreateTable
CREATE TABLE "PayrollFiling" (
    "id" SERIAL NOT NULL,
    "filingType" "PayrollFilingType" NOT NULL DEFAULT 'OFFICIAL_BUSINESS_FORM',
    "status" "PayrollFilingStatus" NOT NULL DEFAULT 'PENDING',
    "accountId" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3),
    "timeOut" TIMESTAMP(3),
    "date" TIMESTAMP(3),
    "hours" DOUBLE PRECISION DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "PayrollFiling_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PayrollFiling" ADD CONSTRAINT "PayrollFiling_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollFiling" ADD CONSTRAINT "PayrollFiling_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
