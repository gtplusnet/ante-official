-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "inTransitWarehouseId" TEXT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_inTransitWarehouseId_fkey" FOREIGN KEY ("inTransitWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
