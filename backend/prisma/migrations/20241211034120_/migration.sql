-- CreateTable
CREATE TABLE "BillOfQuantityTableItems" (
    "id" SERIAL NOT NULL,
    "billOfQuantityId" INTEGER NOT NULL,
    "billOfQuantityTableKey" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillOfQuantityTableItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BillOfQuantityTableItems" ADD CONSTRAINT "BillOfQuantityTableItems_billOfQuantityId_fkey" FOREIGN KEY ("billOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTableItems" ADD CONSTRAINT "BillOfQuantityTableItems_billOfQuantityTableKey_fkey" FOREIGN KEY ("billOfQuantityTableKey") REFERENCES "BillOfQuantityTable"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTableItems" ADD CONSTRAINT "BillOfQuantityTableItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
