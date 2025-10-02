-- AlterTable
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN     "importBatchId" TEXT;

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingRaw_importBatchId_idx" ON "EmployeeTimekeepingRaw"("importBatchId");

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingRaw" ADD CONSTRAINT "EmployeeTimekeepingRaw_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "TimekeepingImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
