/*
  Warnings:

  - You are about to drop the column `isInTransitWarehouse` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the column `isMainWarehouse` on the `Warehouse` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('COMPANY_WAREHOUSE', 'PROJECT_WAREHOUSE', 'IN_TRANSIT_WAREHOUSE');

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "isInTransitWarehouse",
DROP COLUMN "isMainWarehouse",
ADD COLUMN     "warehouseType" "WarehouseType" NOT NULL DEFAULT 'COMPANY_WAREHOUSE';
