-- AlterTable
ALTER TABLE "BillOfQuantity" ADD COLUMN     "sourceBillOfQuantityId" INTEGER;

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_sourceBillOfQuantityId_fkey" FOREIGN KEY ("sourceBillOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
