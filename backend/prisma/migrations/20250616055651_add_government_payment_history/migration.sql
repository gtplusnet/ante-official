-- CreateEnum
CREATE TYPE "GovernmentPaymentType" AS ENUM ('SSS', 'PHILHEALTH', 'PAGIBIG', 'WITHHOLDING_TAX');

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "emailConfigId" TEXT NOT NULL,
    "messageId" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "subject" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "toEmails" JSONB NOT NULL,
    "ccEmails" JSONB,
    "bccEmails" JSONB,
    "preview" TEXT,
    "textContent" TEXT,
    "htmlContent" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "size" INTEGER,
    "uid" TEXT,
    "flags" JSONB,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryComputationAllowances" (
    "id" SERIAL NOT NULL,
    "employeeSalaryComputationId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowancePlanId" INTEGER NOT NULL,

    CONSTRAINT "EmployeeSalaryComputationAllowances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentPaymentHistory" (
    "id" SERIAL NOT NULL,
    "type" "GovernmentPaymentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cutoffDateRangeId" TEXT NOT NULL,
    "employeeTimekeepingCutoffId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentPaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_id_key" ON "Email"("id");

-- CreateIndex
CREATE INDEX "Email_emailConfigId_folder_idx" ON "Email"("emailConfigId", "folder");

-- CreateIndex
CREATE INDEX "Email_emailConfigId_receivedAt_idx" ON "Email"("emailConfigId", "receivedAt");

-- CreateIndex
CREATE INDEX "Email_emailConfigId_isRead_idx" ON "Email"("emailConfigId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Email_emailConfigId_messageId_key" ON "Email"("emailConfigId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAttachment_id_key" ON "EmailAttachment"("id");

-- CreateIndex
CREATE INDEX "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalaryComputationAllowances_employeeSalaryComputati_key" ON "EmployeeSalaryComputationAllowances"("employeeSalaryComputationId", "allowancePlanId");

-- CreateIndex
CREATE INDEX "GovernmentPaymentHistory_cutoffDateRangeId_idx" ON "GovernmentPaymentHistory"("cutoffDateRangeId");

-- CreateIndex
CREATE INDEX "GovernmentPaymentHistory_accountId_idx" ON "GovernmentPaymentHistory"("accountId");

-- CreateIndex
CREATE INDEX "GovernmentPaymentHistory_type_idx" ON "GovernmentPaymentHistory"("type");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_emailConfigId_fkey" FOREIGN KEY ("emailConfigId") REFERENCES "EmailConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationAllowances" ADD CONSTRAINT "EmployeeSalaryComputationAllowances_allowancePlanId_fkey" FOREIGN KEY ("allowancePlanId") REFERENCES "AllowancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationAllowances" ADD CONSTRAINT "EmployeeSalaryComputationAllowances_employeeSalaryComputat_fkey" FOREIGN KEY ("employeeSalaryComputationId") REFERENCES "EmployeeSalaryComputation"("employeeTimekeepingCutoffId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentPaymentHistory" ADD CONSTRAINT "GovernmentPaymentHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentPaymentHistory" ADD CONSTRAINT "GovernmentPaymentHistory_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentPaymentHistory" ADD CONSTRAINT "GovernmentPaymentHistory_employeeTimekeepingCutoffId_fkey" FOREIGN KEY ("employeeTimekeepingCutoffId") REFERENCES "EmployeeTimekeepingCutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
