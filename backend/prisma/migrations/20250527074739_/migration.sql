-- CreateEnum
CREATE TYPE "PayrollFilingType" AS ENUM ('OFFICIAL_BUSINESS_FORM', 'CERTIFICATE_OF_ATTENDANCE');

-- CreateTable
CREATE TABLE "PayrollTimekeepingFiling" (
    "id" SERIAL NOT NULL,
    "filingType" "PayrollFilingType" NOT NULL DEFAULT 'OFFICIAL_BUSINESS_FORM',
    "accountId" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "timeSpan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollTimekeepingFiling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollOvertimeFiling" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollOvertimeFiling_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PayrollTimekeepingFiling" ADD CONSTRAINT "PayrollTimekeepingFiling_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTimekeepingFiling" ADD CONSTRAINT "PayrollTimekeepingFiling_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollOvertimeFiling" ADD CONSTRAINT "PayrollOvertimeFiling_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollOvertimeFiling" ADD CONSTRAINT "PayrollOvertimeFiling_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
