-- CreateTable
CREATE TABLE "POSDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "POSDevice_deviceId_key" ON "POSDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "POSDevice_apiKey_key" ON "POSDevice"("apiKey");

-- CreateIndex
CREATE INDEX "POSDevice_companyId_idx" ON "POSDevice"("companyId");

-- CreateIndex
CREATE INDEX "POSDevice_branchId_idx" ON "POSDevice"("branchId");

-- CreateIndex
CREATE INDEX "POSDevice_deviceId_idx" ON "POSDevice"("deviceId");

-- AddForeignKey
ALTER TABLE "POSDevice" ADD CONSTRAINT "POSDevice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSDevice" ADD CONSTRAINT "POSDevice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_DEVICE_MANAGEMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_WORKFLOW_ACCESS';
