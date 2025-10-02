-- CreateTable
CREATE TABLE "SchoolNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT,
    "studentName" VARCHAR(255),
    "guardianId" TEXT NOT NULL,
    "actionUrl" VARCHAR(500),
    "actionText" VARCHAR(100),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "imageUrl" VARCHAR(500),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SchoolNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolNotification_guardianId_timestamp_idx" ON "SchoolNotification"("guardianId", "timestamp");

-- CreateIndex
CREATE INDEX "SchoolNotification_studentId_idx" ON "SchoolNotification"("studentId");

-- CreateIndex
CREATE INDEX "SchoolNotification_type_idx" ON "SchoolNotification"("type");

-- CreateIndex
CREATE INDEX "SchoolNotification_guardianId_read_idx" ON "SchoolNotification"("guardianId", "read");

-- CreateIndex
CREATE INDEX "SchoolNotification_priority_timestamp_idx" ON "SchoolNotification"("priority", "timestamp");

-- CreateIndex
CREATE INDEX "SchoolNotification_expiresAt_idx" ON "SchoolNotification"("expiresAt");

-- AddForeignKey
ALTER TABLE "SchoolNotification" ADD CONSTRAINT "SchoolNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolNotification" ADD CONSTRAINT "SchoolNotification_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
