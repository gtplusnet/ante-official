/*
  Warnings:

  - Added the required column `accountNumber` to the `FundAccounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FundAccounts" ADD COLUMN     "accountNumber" INTEGER NOT NULL;
