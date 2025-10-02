-- CreateTable
CREATE TABLE "EquipmentPartsItem" (
    "id" SERIAL NOT NULL,
    "equipmentPartsId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentPartsItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentPartsItem" ADD CONSTRAINT "EquipmentPartsItem_equipmentPartsId_fkey" FOREIGN KEY ("equipmentPartsId") REFERENCES "EquipmentParts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPartsItem" ADD CONSTRAINT "EquipmentPartsItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
