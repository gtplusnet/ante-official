/*
  Warnings:

  - You are about to drop the column `estimatedBuyingPrice` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `tag_key` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `Tier` table. All the data in the column will be lost.
  - You are about to drop the column `tierKey` on the `Tier` table. All the data in the column will be lost.
  - You are about to drop the column `attributeKey` on the `TierAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `tier_id` on the `TierAttribute` table. All the data in the column will be lost.
  - Added the required column `tagKey` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `Tier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierKey` to the `Tier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attributeKey` to the `TierAttribute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierId` to the `TierAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_item_id_fkey";

-- DropForeignKey
ALTER TABLE "TierAttribute" DROP CONSTRAINT "TierAttribute_tier_id_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "estimatedBuyingPrice",
ADD COLUMN     "estimatedBuyingPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "tag_key",
ADD COLUMN     "tagKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tier" DROP COLUMN "item_id",
DROP COLUMN "tierKey",
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "tierKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TierAttribute" DROP COLUMN "attributeKey",
DROP COLUMN "tier_id",
ADD COLUMN     "attributeKey" TEXT NOT NULL,
ADD COLUMN     "tierId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierAttribute" ADD CONSTRAINT "TierAttribute_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
