-- AlterTable
ALTER TABLE "PayrollFiling" ADD COLUMN     "fileId" INTEGER;

-- AddForeignKey
ALTER TABLE "PayrollFiling" ADD CONSTRAINT "PayrollFiling_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
