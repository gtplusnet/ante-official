-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "deviceTokens" TEXT[],
ADD COLUMN     "lastAppLogin" TIMESTAMP(3),
ADD COLUMN     "notificationPreferences" JSONB,
ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE "GuardianToken" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianNotification" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianToken_token_key" ON "GuardianToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianToken_refreshToken_key" ON "GuardianToken"("refreshToken");

-- CreateIndex
CREATE INDEX "GuardianToken_token_idx" ON "GuardianToken"("token");

-- CreateIndex
CREATE INDEX "GuardianToken_refreshToken_idx" ON "GuardianToken"("refreshToken");

-- CreateIndex
CREATE INDEX "GuardianToken_guardianId_idx" ON "GuardianToken"("guardianId");

-- CreateIndex
CREATE INDEX "GuardianToken_expiresAt_idx" ON "GuardianToken"("expiresAt");

-- CreateIndex
CREATE INDEX "GuardianNotification_guardianId_readAt_idx" ON "GuardianNotification"("guardianId", "readAt");

-- CreateIndex
CREATE INDEX "GuardianNotification_guardianId_type_idx" ON "GuardianNotification"("guardianId", "type");

-- CreateIndex
CREATE INDEX "GuardianNotification_createdAt_idx" ON "GuardianNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "GuardianToken" ADD CONSTRAINT "GuardianToken_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianNotification" ADD CONSTRAINT "GuardianNotification_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
