-- AlterTable
ALTER TABLE "Project" ADD COLUMN "mainWarehouseId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_mainWarehouseId_fkey" FOREIGN KEY ("mainWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
