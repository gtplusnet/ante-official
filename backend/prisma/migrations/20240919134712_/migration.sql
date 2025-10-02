/*
  Warnings:

  - You are about to drop the `FundAccounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FundTransactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FundAccountType" AS ENUM ('CASH', 'BANK', 'CHECK', 'EWALLET');

-- CreateEnum
CREATE TYPE "FundTransactionType" AS ENUM ('ADD', 'SUBTRACT');

-- CreateEnum
CREATE TYPE "FundTransactionCode" AS ENUM ('MANUAL_ADD', 'MANUAL_DEDUCT');

-- DropForeignKey
ALTER TABLE "FundTransactions" DROP CONSTRAINT "FundTransactions_fundAccountId_fkey";

-- DropTable
DROP TABLE "FundAccounts";

-- DropTable
DROP TABLE "FundTransactions";

-- DropEnum
DROP TYPE "FundAccountsType";

-- DropEnum
DROP TYPE "FundTransactionsCode";

-- DropEnum
DROP TYPE "FundTransactionsType";

-- CreateTable
CREATE TABLE "FundAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "description" TEXT,
    "balance" DOUBLE PRECISION NOT NULL,
    "type" "FundAccountType" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundTransaction" (
    "id" TEXT NOT NULL,
    "fundAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" "FundTransactionType" NOT NULL,
    "code" "FundTransactionCode" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "FundAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
