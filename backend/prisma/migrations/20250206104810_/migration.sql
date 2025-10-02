/*
  Warnings:

  - A unique constraint covering the columns `[equipmentPartsId,itemId]` on the table `EquipmentPartsItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EquipmentPartsItem_equipmentPartsId_itemId_key" ON "EquipmentPartsItem"("equipmentPartsId", "itemId");
