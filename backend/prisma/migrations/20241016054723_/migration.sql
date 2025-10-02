-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_locationId_fkey";

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "size" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "locationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
