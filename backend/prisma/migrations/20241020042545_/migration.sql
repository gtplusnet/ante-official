/*
  Warnings:

  - You are about to drop the column `pickupLocationId` on the `ItemReceipt` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_pickupLocationId_fkey";

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "pickupLocationId" TEXT;

-- AlterTable
ALTER TABLE "ItemReceipt" DROP COLUMN "pickupLocationId";

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
