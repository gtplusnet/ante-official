-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('TIME_IN', 'TIME_OUT');

-- CreateTable
CREATE TABLE "DeviceLicense" (
    "id" SERIAL NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "licenseType" "LicenseType" NOT NULL,
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dateFirstUsed" TIMESTAMP(3),
    "dateLastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeviceLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceConnection" (
    "id" SERIAL NOT NULL,
    "licenseId" INTEGER NOT NULL,
    "deviceName" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "ipAddress" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" JSONB,
    "connectionCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLicense_licenseKey_key" ON "DeviceLicense"("licenseKey");

-- CreateIndex
CREATE INDEX "DeviceLicense_companyId_idx" ON "DeviceLicense"("companyId");

-- CreateIndex
CREATE INDEX "DeviceLicense_licenseKey_idx" ON "DeviceLicense"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceConnection_licenseId_key" ON "DeviceConnection"("licenseId");

-- CreateIndex
CREATE INDEX "DeviceConnection_macAddress_idx" ON "DeviceConnection"("macAddress");

-- CreateIndex
CREATE INDEX "DeviceConnection_licenseId_idx" ON "DeviceConnection"("licenseId");

-- AddForeignKey
ALTER TABLE "DeviceLicense" ADD CONSTRAINT "DeviceLicense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceConnection" ADD CONSTRAINT "DeviceConnection_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "DeviceLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
