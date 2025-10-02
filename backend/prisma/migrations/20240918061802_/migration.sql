-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_warehouseId_fkey";

-- AlterTable
ALTER TABLE "ItemReceipt" ALTER COLUMN "supplierId" DROP NOT NULL,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
