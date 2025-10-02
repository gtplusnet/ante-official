-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "isInTransitWarehouse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMainWarehouse" BOOLEAN NOT NULL DEFAULT false;
