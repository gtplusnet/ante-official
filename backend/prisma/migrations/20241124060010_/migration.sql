-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "PurchaseRequestId" INTEGER;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_PurchaseRequestId_fkey" FOREIGN KEY ("PurchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
