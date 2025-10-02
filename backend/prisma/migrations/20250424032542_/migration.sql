-- AlterTable
ALTER TABLE "LocalHoliday" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "LocalHoliday" ADD CONSTRAINT "LocalHoliday_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
