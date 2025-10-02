-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "inTransitDeliveryReceiptId" INTEGER;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_inTransitDeliveryReceiptId_fkey" FOREIGN KEY ("inTransitDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
