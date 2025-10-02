/*
  Warnings:

  - You are about to drop the column `businessName` on the `Supplier` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('CASH_ON_DELIVERY', 'PAYMENT_UPON_INVOICE', 'POST_DATED_CHECK', 'DATED_DELIVERY_UPON_PAYMENT');

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "businessName",
ADD COLUMN     "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'CASH_ON_DELIVERY';
