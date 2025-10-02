-- AlterTable
ALTER TABLE "PurchaseRequestSuppliers" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "PurchaseRequestSuppliers" ADD CONSTRAINT "PurchaseRequestSuppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
