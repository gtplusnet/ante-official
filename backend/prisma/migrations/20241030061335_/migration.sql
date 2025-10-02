/*
  Warnings:

  - Added the required column `updateById` to the `SupplierPriceUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SupplierPriceUpdate" ADD COLUMN     "updateById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_updateById_fkey" FOREIGN KEY ("updateById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
