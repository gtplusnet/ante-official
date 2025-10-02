/*
  Warnings:

  - Added the required column `amount` to the `PurchaseOrderPayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseOrderPayment" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
