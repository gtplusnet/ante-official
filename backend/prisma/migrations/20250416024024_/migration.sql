-- AlterTable
ALTER TABLE "PayrollGroup" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollGroup" ADD CONSTRAINT "PayrollGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
