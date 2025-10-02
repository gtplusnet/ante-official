/*
  Warnings:

  - Added the required column `updatedAt` to the `SupplierItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SupplierItems" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SupplierPriceUpdate" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPriceUpdate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
