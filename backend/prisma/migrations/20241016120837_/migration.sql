/*
  Warnings:

  - The values [IN_PROGRESS,CANCELLED] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Delivery` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `deliveredAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLocationId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `equipementModelId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLocationId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `placedAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `subjectTitle` on the `Delivery` table. All the data in the column will be lost.
  - The `id` column on the `Delivery` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `deliveryDate` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toWarehouseId` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING', 'CANCELED', 'DELIVERED');
ALTER TABLE "Delivery" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Delivery" ALTER COLUMN "status" TYPE "DeliveryStatus_new" USING ("status"::text::"DeliveryStatus_new");
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "DeliveryStatus_old";
ALTER TABLE "Delivery" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_deliveryLocationId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_equipementModelId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_pickupLocationId_fkey";

-- AlterTable
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_pkey",
DROP COLUMN "deliveredAt",
DROP COLUMN "deliveryLocationId",
DROP COLUMN "equipementModelId",
DROP COLUMN "isDeleted",
DROP COLUMN "pickupLocationId",
DROP COLUMN "placedAt",
DROP COLUMN "remarks",
DROP COLUMN "scheduledAt",
DROP COLUMN "subjectTitle",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "deliveryReceiptId" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fromWarehouseId" TEXT,
ADD COLUMN     "toWarehouseId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ADD CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveryReceiptId_fkey" FOREIGN KEY ("deliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
