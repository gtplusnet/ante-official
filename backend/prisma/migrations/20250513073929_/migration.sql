-- CreateEnum
CREATE TYPE "DeductionCategory" AS ENUM ('LOAN', 'DEDUCTION', 'DEMINIMIS');

-- CreateTable
CREATE TABLE "DeductionConfiguration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DeductionCategory" NOT NULL,
    "parentDeductionId" INTEGER,

    CONSTRAINT "DeductionConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "deductionConfigurationId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "monthlyAmortization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionPlanHistory" (
    "id" SERIAL NOT NULL,
    "deductionPlanId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "beforeBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "afterBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeductionPlanHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeductionConfiguration" ADD CONSTRAINT "DeductionConfiguration_parentDeductionId_fkey" FOREIGN KEY ("parentDeductionId") REFERENCES "DeductionConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionPlan" ADD CONSTRAINT "DeductionPlan_deductionConfigurationId_fkey" FOREIGN KEY ("deductionConfigurationId") REFERENCES "DeductionConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionPlan" ADD CONSTRAINT "DeductionPlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionPlanHistory" ADD CONSTRAINT "DeductionPlanHistory_deductionPlanId_fkey" FOREIGN KEY ("deductionPlanId") REFERENCES "DeductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
