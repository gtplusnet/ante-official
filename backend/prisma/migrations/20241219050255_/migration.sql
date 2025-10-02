-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "variantCombination" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ItemTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTierAttribute" (
    "id" TEXT NOT NULL,
    "itemTierId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTierAttribute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemTierAttribute" ADD CONSTRAINT "ItemTierAttribute_itemTierId_fkey" FOREIGN KEY ("itemTierId") REFERENCES "ItemTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
