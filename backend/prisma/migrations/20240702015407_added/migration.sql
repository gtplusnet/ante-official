/*
  Warnings:

  - You are about to drop the `GeneralInventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VariationInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneralInventory" DROP CONSTRAINT "GeneralInventory_createdById_fkey";

-- DropForeignKey
ALTER TABLE "GeneralInventory" DROP CONSTRAINT "GeneralInventory_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "GeneralInventory" DROP CONSTRAINT "GeneralInventory_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "VariationInventory" DROP CONSTRAINT "VariationInventory_createdById_fkey";

-- DropForeignKey
ALTER TABLE "VariationInventory" DROP CONSTRAINT "VariationInventory_generalInventoryId_fkey";

-- DropForeignKey
ALTER TABLE "VariationInventory" DROP CONSTRAINT "VariationInventory_updatedById_fkey";

-- DropTable
DROP TABLE "GeneralInventory";

-- DropTable
DROP TABLE "VariationInventory";

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedBuyingPrice" DOUBLE PRECISION,
    "size" INTEGER,
    "isVariation" BOOLEAN NOT NULL,
    "parent" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "tierKey" TEXT NOT NULL,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierAttribute" (
    "id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,

    CONSTRAINT "TierAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "tag_key" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "Item"("sku");

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierAttribute" ADD CONSTRAINT "TierAttribute_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
