-- CreateTable
CREATE TABLE "SchoolAttendance" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT,
    "location" TEXT,
    "syncedAt" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolAttendance_companyId_timestamp_idx" ON "SchoolAttendance"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "SchoolAttendance_personId_idx" ON "SchoolAttendance"("personId");

-- CreateIndex
CREATE INDEX "SchoolAttendance_qrCode_idx" ON "SchoolAttendance"("qrCode");

-- CreateIndex
CREATE INDEX "SchoolAttendance_syncedAt_idx" ON "SchoolAttendance"("syncedAt");

-- AddForeignKey
ALTER TABLE "SchoolAttendance" ADD CONSTRAINT "SchoolAttendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
