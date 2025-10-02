-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sentBy" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "module" TEXT NOT NULL,
    "moduleContext" TEXT,
    "to" JSONB NOT NULL,
    "cc" JSONB,
    "bcc" JSONB,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "messageId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentEmail_id_key" ON "SentEmail"("id");

-- CreateIndex
CREATE INDEX "SentEmail_companyId_sentAt_idx" ON "SentEmail"("companyId", "sentAt");

-- CreateIndex
CREATE INDEX "SentEmail_module_idx" ON "SentEmail"("module");

-- CreateIndex
CREATE INDEX "SentEmail_status_idx" ON "SentEmail"("status");

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
