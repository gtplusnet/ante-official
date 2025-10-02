-- AlterTable
ALTER TABLE "EmployeeTimekeepingLogs" ADD COLUMN     "sourceRawId" INTEGER;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingLogs" ADD CONSTRAINT "EmployeeTimekeepingLogs_sourceRawId_fkey" FOREIGN KEY ("sourceRawId") REFERENCES "EmployeeTimekeepingRaw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
