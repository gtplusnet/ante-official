-- CreateEnum
CREATE TYPE "FundAccountsType" AS ENUM ('CASH', 'BANK', 'CHECK', 'EWALLET');

-- CreateEnum
CREATE TYPE "FundTransactionsType" AS ENUM ('ADD', 'SUBTRACT');

-- CreateEnum
CREATE TYPE "FundTransactionsCode" AS ENUM ('MANUAL_ADD', 'MANUAL_DEDUCT');

-- CreateTable
CREATE TABLE "FundAccounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balance" DOUBLE PRECISION NOT NULL,
    "type" "FundAccountsType" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundTransactions" (
    "id" TEXT NOT NULL,
    "fundAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" "FundTransactionsType" NOT NULL,
    "code" "FundTransactionsCode" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundTransactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FundTransactions" ADD CONSTRAINT "FundTransactions_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "FundAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
