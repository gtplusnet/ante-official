-- CreateTable
CREATE TABLE "EmployeeImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmployeeImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeImportTemp" (
    "id" SERIAL NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "reportsTo" TEXT,
    "monthlyRate" DOUBLE PRECISION NOT NULL,
    "employeeStatus" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "branch" TEXT NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "payrollGroupCode" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "hasWarnings" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "validationWarnings" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeImportTemp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeImportBatch_companyId_startedAt_idx" ON "EmployeeImportBatch"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "EmployeeImportTemp_importBatchId_idx" ON "EmployeeImportTemp"("importBatchId");

-- CreateIndex
CREATE INDEX "EmployeeImportTemp_employeeCode_idx" ON "EmployeeImportTemp"("employeeCode");

-- AddForeignKey
ALTER TABLE "EmployeeImportBatch" ADD CONSTRAINT "EmployeeImportBatch_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeImportBatch" ADD CONSTRAINT "EmployeeImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeImportTemp" ADD CONSTRAINT "EmployeeImportTemp_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "EmployeeImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
