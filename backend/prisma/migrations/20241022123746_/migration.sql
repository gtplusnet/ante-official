-- CreateTable
CREATE TABLE "DeliveryReceive" (
    "id" SERIAL NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "itemReceiptId" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryReceive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeliveryReceive" ADD CONSTRAINT "DeliveryReceive_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryReceive" ADD CONSTRAINT "DeliveryReceive_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
