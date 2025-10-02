-- AlterTable
ALTER TABLE "DeviceConnection" ADD COLUMN     "lastGuardianSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastStudentSyncAt" TIMESTAMP(3),
ADD COLUMN     "syncSettings" JSONB;

-- CreateTable
CREATE TABLE "SyncHistory" (
    "id" SERIAL NOT NULL,
    "deviceConnectionId" INTEGER NOT NULL,
    "syncType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "recordsFetched" INTEGER NOT NULL,
    "syncStartTime" TIMESTAMP(3) NOT NULL,
    "syncEndTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncHistory_deviceConnectionId_createdAt_idx" ON "SyncHistory"("deviceConnectionId", "createdAt");

-- AddForeignKey
ALTER TABLE "SyncHistory" ADD CONSTRAINT "SyncHistory_deviceConnectionId_fkey" FOREIGN KEY ("deviceConnectionId") REFERENCES "DeviceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
