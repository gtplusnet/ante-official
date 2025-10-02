/*
  Warnings:

  - You are about to drop the column `pickupLocationId` on the `Delivery` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_pickupLocationId_fkey";

-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "pickupLocationId",
ADD COLUMN     "pickUpLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pickUpLocationId_fkey" FOREIGN KEY ("pickUpLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
