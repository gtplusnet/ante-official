/*
  Warnings:

  - You are about to drop the `Tier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TierAttribute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_itemId_fkey";

-- DropForeignKey
ALTER TABLE "TierAttribute" DROP CONSTRAINT "TierAttribute_tierId_fkey";

-- DropTable
DROP TABLE "Tier";

-- DropTable
DROP TABLE "TierAttribute";
