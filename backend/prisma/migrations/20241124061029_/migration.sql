/*
  Warnings:

  - You are about to drop the column `PurchaseRequestId` on the `PurchaseOrder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_PurchaseRequestId_fkey";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "PurchaseRequestId",
ADD COLUMN     "purchaseRequestId" INTEGER;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
