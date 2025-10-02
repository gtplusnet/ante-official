/*
  Warnings:

  - You are about to drop the column `companyId` on the `PurchaseRequestSuppliers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PurchaseRequestSuppliers" DROP CONSTRAINT "PurchaseRequestSuppliers_companyId_fkey";

-- AlterTable
ALTER TABLE "PurchaseRequestSuppliers" DROP COLUMN "companyId";

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
