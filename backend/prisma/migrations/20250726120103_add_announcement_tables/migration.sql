-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "icon" VARCHAR(50) NOT NULL DEFAULT 'campaign',
    "iconColor" VARCHAR(20) NOT NULL DEFAULT '#615FF6',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "companyId" INTEGER,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementView" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "viewedById" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAcknowledgment" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "acknowledgedById" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE INDEX "Announcement_companyId_idx" ON "Announcement"("companyId");

-- CreateIndex
CREATE INDEX "AnnouncementView_viewedAt_idx" ON "AnnouncementView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementView_announcementId_viewedById_key" ON "AnnouncementView"("announcementId", "viewedById");

-- CreateIndex
CREATE INDEX "AnnouncementAcknowledgment_acknowledgedAt_idx" ON "AnnouncementAcknowledgment"("acknowledgedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementAcknowledgment_announcementId_acknowledgedById_key" ON "AnnouncementAcknowledgment"("announcementId", "acknowledgedById");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementView" ADD CONSTRAINT "AnnouncementView_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementView" ADD CONSTRAINT "AnnouncementView_viewedById_fkey" FOREIGN KEY ("viewedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
