-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'INCOMPLETE';

-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "pickupLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
