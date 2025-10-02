-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('SUPPLIER_OUTSOURCING', 'MATERIAL_APPROVED', 'CANVASSING', 'SUPPLIER_SELECTION', 'PURCHASE_ORDER');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('OPEN', 'CLOSE');

-- CreateEnum
CREATE TYPE "DeliveryTerms" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "deliveryTerms" "DeliveryTerms" NOT NULL DEFAULT 'PICKUP';

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "contactPerson" TEXT;

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "itemReceiptId" INTEGER NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" SERIAL NOT NULL,
    "itemReceiptId" INTEGER NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierItems" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SupplierItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierItems" ADD CONSTRAINT "SupplierItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierItems" ADD CONSTRAINT "SupplierItems_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
