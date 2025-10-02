-- CreateTable
CREATE TABLE "PurchaseRequestSuppliers" (
    "id" SERIAL NOT NULL,
    "purchaseRequestId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NO_PAYMENT_TERMS',
    "deliveryTerms" "DeliveryTerms" NOT NULL DEFAULT 'DELIVERY',

    CONSTRAINT "PurchaseRequestSuppliers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PurchaseRequestSuppliers" ADD CONSTRAINT "PurchaseRequestSuppliers_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestSuppliers" ADD CONSTRAINT "PurchaseRequestSuppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
