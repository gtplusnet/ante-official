/*
  Warnings:

  - You are about to drop the column `title` on the `PettyCashLiquidation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PettyCashLiquidation" DROP COLUMN "title",
ADD COLUMN     "businessPurpose" TEXT,
ADD COLUMN     "expenseCategory" TEXT,
ADD COLUMN     "isAiExtracted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiptDate" TIMESTAMP(3),
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "vendorAddress" TEXT,
ADD COLUMN     "vendorName" TEXT,
ADD COLUMN     "vendorTin" TEXT;
