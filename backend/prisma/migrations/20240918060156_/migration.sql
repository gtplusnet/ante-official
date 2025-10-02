/*
  Warnings:

  - You are about to drop the `PurchaseOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrderItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemReceiptType" AS ENUM ('PURCHASE_ORDER', 'PURCHASE_REQUEST');

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItems" DROP CONSTRAINT "PurchaseOrderItems_itemId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItems" DROP CONSTRAINT "PurchaseOrderItems_purchaseOrderId_fkey";

-- DropTable
DROP TABLE "PurchaseOrder";

-- DropTable
DROP TABLE "PurchaseOrderItems";

-- DropEnum
DROP TYPE "PurchaseOrderType";

-- CreateTable
CREATE TABLE "ItemReceipt" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" "ItemReceiptType" NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalPayableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSettledAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemReceiptItems" (
    "id" SERIAL NOT NULL,
    "itemReceiptId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemReceiptItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceiptItems" ADD CONSTRAINT "ItemReceiptItems_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceiptItems" ADD CONSTRAINT "ItemReceiptItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
