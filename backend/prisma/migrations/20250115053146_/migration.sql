-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "BillOfQuantityId" INTEGER;

-- AlterTable
ALTER TABLE "ItemReceiptItems" ADD COLUMN     "boqTableKey" INTEGER;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_BillOfQuantityId_fkey" FOREIGN KEY ("BillOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceiptItems" ADD CONSTRAINT "ItemReceiptItems_boqTableKey_fkey" FOREIGN KEY ("boqTableKey") REFERENCES "BillOfQuantityTable"("key") ON DELETE CASCADE ON UPDATE CASCADE;
