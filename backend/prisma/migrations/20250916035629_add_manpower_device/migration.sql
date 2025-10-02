-- CreateEnum
ALTER TYPE "TimekeepingSource" ADD VALUE 'DEVICE';

-- CreateTable
CREATE TABLE "ManpowerDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "companyId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerDevice_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerDevice_deviceId_key" ON "ManpowerDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerDevice_apiKey_key" ON "ManpowerDevice"("apiKey");

-- CreateIndex
CREATE INDEX "ManpowerDevice_companyId_idx" ON "ManpowerDevice"("companyId");

-- CreateIndex
CREATE INDEX "ManpowerDevice_isActive_idx" ON "ManpowerDevice"("isActive");

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingRaw_deviceId_idx" ON "EmployeeTimekeepingRaw"("deviceId");

-- AddForeignKey
ALTER TABLE "ManpowerDevice" ADD CONSTRAINT "ManpowerDevice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerDevice" ADD CONSTRAINT "ManpowerDevice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingRaw" ADD CONSTRAINT "EmployeeTimekeepingRaw_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "ManpowerDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;