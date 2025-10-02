-- CreateTable
CREATE TABLE "AllowanceImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "allowanceConfigurationId" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AllowanceImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowanceImportTemp" (
    "id" SERIAL NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "allowanceAmount" DECIMAL(10,2) NOT NULL,
    "allowancePeriod" "DeductionPeriod" NOT NULL,
    "effectivityDate" TIMESTAMP(3) NOT NULL,
    "proRatedAllowance" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validationErrors" JSONB,
    "validationWarnings" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAllowancePlanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowanceImportTemp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "deductionConfigurationId" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DeductionImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionImportTemp" (
    "id" SERIAL NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "loanAmount" DECIMAL(10,2),
    "monthlyAmortization" DECIMAL(10,2) NOT NULL,
    "deductionPeriod" "DeductionPeriod" NOT NULL,
    "effectivityDate" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validationErrors" JSONB,
    "validationWarnings" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdDeductionPlanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionImportTemp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AllowanceImportBatch_companyId_startedAt_idx" ON "AllowanceImportBatch"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "AllowanceImportBatch_allowanceConfigurationId_idx" ON "AllowanceImportBatch"("allowanceConfigurationId");

-- CreateIndex
CREATE INDEX "AllowanceImportBatch_status_idx" ON "AllowanceImportBatch"("status");

-- CreateIndex
CREATE INDEX "AllowanceImportTemp_importBatchId_idx" ON "AllowanceImportTemp"("importBatchId");

-- CreateIndex
CREATE INDEX "AllowanceImportTemp_employeeCode_idx" ON "AllowanceImportTemp"("employeeCode");

-- CreateIndex
CREATE INDEX "AllowanceImportTemp_isValid_idx" ON "AllowanceImportTemp"("isValid");

-- CreateIndex
CREATE INDEX "AllowanceImportTemp_isProcessed_idx" ON "AllowanceImportTemp"("isProcessed");

-- CreateIndex
CREATE INDEX "DeductionImportBatch_companyId_startedAt_idx" ON "DeductionImportBatch"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "DeductionImportBatch_deductionConfigurationId_idx" ON "DeductionImportBatch"("deductionConfigurationId");

-- CreateIndex
CREATE INDEX "DeductionImportBatch_status_idx" ON "DeductionImportBatch"("status");

-- CreateIndex
CREATE INDEX "DeductionImportTemp_importBatchId_idx" ON "DeductionImportTemp"("importBatchId");

-- CreateIndex
CREATE INDEX "DeductionImportTemp_employeeCode_idx" ON "DeductionImportTemp"("employeeCode");

-- CreateIndex
CREATE INDEX "DeductionImportTemp_isValid_idx" ON "DeductionImportTemp"("isValid");

-- CreateIndex
CREATE INDEX "DeductionImportTemp_isProcessed_idx" ON "DeductionImportTemp"("isProcessed");

-- AddForeignKey
ALTER TABLE "AllowanceImportBatch" ADD CONSTRAINT "AllowanceImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceImportBatch" ADD CONSTRAINT "AllowanceImportBatch_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceImportBatch" ADD CONSTRAINT "AllowanceImportBatch_allowanceConfigurationId_fkey" FOREIGN KEY ("allowanceConfigurationId") REFERENCES "AllowanceConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceImportTemp" ADD CONSTRAINT "AllowanceImportTemp_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "AllowanceImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceImportTemp" ADD CONSTRAINT "AllowanceImportTemp_createdAllowancePlanId_fkey" FOREIGN KEY ("createdAllowancePlanId") REFERENCES "AllowancePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionImportBatch" ADD CONSTRAINT "DeductionImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionImportBatch" ADD CONSTRAINT "DeductionImportBatch_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionImportBatch" ADD CONSTRAINT "DeductionImportBatch_deductionConfigurationId_fkey" FOREIGN KEY ("deductionConfigurationId") REFERENCES "DeductionConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionImportTemp" ADD CONSTRAINT "DeductionImportTemp_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "DeductionImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionImportTemp" ADD CONSTRAINT "DeductionImportTemp_createdDeductionPlanId_fkey" FOREIGN KEY ("createdDeductionPlanId") REFERENCES "DeductionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
