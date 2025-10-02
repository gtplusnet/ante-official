-- CreateEnum
CREATE TYPE "PettyCashTransactionType" AS ENUM ('INITIAL', 'REFILL', 'DEDUCTION', 'LIQUIDATION');

-- AlterTable
ALTER TABLE "PettyCashLiquidation" ADD COLUMN     "pettyCashHolderId" INTEGER;

-- CreateTable
CREATE TABLE "PettyCashHolder" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,

    CONSTRAINT "PettyCashHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashTransaction" (
    "id" SERIAL NOT NULL,
    "pettyCashHolderId" INTEGER NOT NULL,
    "type" "PettyCashTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_pettyCashHolderId_fkey" FOREIGN KEY ("pettyCashHolderId") REFERENCES "PettyCashHolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashHolder" ADD CONSTRAINT "PettyCashHolder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashHolder" ADD CONSTRAINT "PettyCashHolder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_pettyCashHolderId_fkey" FOREIGN KEY ("pettyCashHolderId") REFERENCES "PettyCashHolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
