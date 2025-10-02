-- AlterTable
ALTER TABLE "RequestForPayment" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "RequestForPayment" ADD CONSTRAINT "RequestForPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
