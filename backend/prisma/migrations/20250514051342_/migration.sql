/*
  Warnings:

  - Added the required column `remarks` to the `DeductionPlanHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "FundTransactionCode" ADD VALUE 'INITIAL_LOAN_BALANCE';

-- AlterTable
ALTER TABLE "DeductionPlanHistory" ADD COLUMN     "remarks" TEXT NOT NULL;
