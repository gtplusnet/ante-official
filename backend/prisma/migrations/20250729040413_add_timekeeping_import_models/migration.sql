-- AlterTable
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN     "remarks" TEXT;

-- CreateTable
CREATE TABLE "TimekeepingImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "overlappingRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TimekeepingImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimekeepingImportTemp" (
    "id" SERIAL NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT,
    "accountId" TEXT,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "validationErrors" JSONB,
    "validationWarnings" JSONB,
    "overlappingLogs" JSONB,
    "hasOverlap" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimekeepingImportTemp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimekeepingImportBatch_companyId_startedAt_idx" ON "TimekeepingImportBatch"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "TimekeepingImportBatch_status_idx" ON "TimekeepingImportBatch"("status");

-- CreateIndex
CREATE INDEX "TimekeepingImportTemp_importBatchId_idx" ON "TimekeepingImportTemp"("importBatchId");

-- CreateIndex
CREATE INDEX "TimekeepingImportTemp_employeeCode_idx" ON "TimekeepingImportTemp"("employeeCode");

-- CreateIndex
CREATE INDEX "TimekeepingImportTemp_isValid_idx" ON "TimekeepingImportTemp"("isValid");

-- CreateIndex
CREATE INDEX "TimekeepingImportTemp_isProcessed_idx" ON "TimekeepingImportTemp"("isProcessed");

-- CreateIndex
CREATE INDEX "TimekeepingImportTemp_hasOverlap_idx" ON "TimekeepingImportTemp"("hasOverlap");

-- AddForeignKey
ALTER TABLE "TimekeepingImportBatch" ADD CONSTRAINT "TimekeepingImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimekeepingImportBatch" ADD CONSTRAINT "TimekeepingImportBatch_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimekeepingImportTemp" ADD CONSTRAINT "TimekeepingImportTemp_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "TimekeepingImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
