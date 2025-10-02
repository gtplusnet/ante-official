/*
  Warnings:

  - You are about to drop the column `isMainWarehouse` on the `ItemReceipt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ItemReceipt" DROP COLUMN "isMainWarehouse";

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "isMainWarehouse" BOOLEAN NOT NULL DEFAULT false;
