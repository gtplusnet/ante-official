/*
  Warnings:

  - You are about to drop the column `deliveryReceiptId` on the `Delivery` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_deliveryReceiptId_fkey";

-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "deliveryReceiptId",
ADD COLUMN     "deliveredDeliveryReceiptId" INTEGER,
ADD COLUMN     "sourceDeliveryReceiptId" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_sourceDeliveryReceiptId_fkey" FOREIGN KEY ("sourceDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveredDeliveryReceiptId_fkey" FOREIGN KEY ("deliveredDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
