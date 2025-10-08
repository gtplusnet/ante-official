-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "colorCode" TEXT NOT NULL DEFAULT '#2196F3',
    "categoryId" INTEGER,
    "creatorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventRecurrence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "recurrenceType" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "interval" TEXT,
    "byDay" TEXT[],
    "byMonthDay" INTEGER[],
    "byMonth" INTEGER[],
    "count" INTEGER,
    "until" TIMESTAMP(3),
    "exceptions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventRecurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventInstance" (
    "id" TEXT NOT NULL,
    "parentEventId" TEXT NOT NULL,
    "instanceDate" TIMESTAMP(3) NOT NULL,
    "originalStart" TIMESTAMP(3) NOT NULL,
    "originalEnd" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "startDateTime" TIMESTAMP(3),
    "endDateTime" TIMESTAMP(3),
    "colorCode" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT,
    "responseStatus" TEXT NOT NULL DEFAULT 'pending',
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CalendarEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventAttachment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEventAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'popup',
    "minutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_creatorId_startDateTime_idx" ON "CalendarEvent"("creatorId", "startDateTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_categoryId_idx" ON "CalendarEvent"("categoryId");

-- CreateIndex
CREATE INDEX "CalendarEvent_companyId_idx" ON "CalendarEvent"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventRecurrence_eventId_key" ON "CalendarEventRecurrence"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventRecurrence_eventId_idx" ON "CalendarEventRecurrence"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventInstance_parentEventId_instanceDate_key" ON "CalendarEventInstance"("parentEventId", "instanceDate");

-- CreateIndex
CREATE INDEX "CalendarEventInstance_parentEventId_instanceDate_idx" ON "CalendarEventInstance"("parentEventId", "instanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventAttendee_eventId_accountId_key" ON "CalendarEventAttendee"("eventId", "accountId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_eventId_idx" ON "CalendarEventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_accountId_idx" ON "CalendarEventAttendee"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarCategory_name_companyId_key" ON "CalendarCategory"("name", "companyId");

-- CreateIndex
CREATE INDEX "CalendarCategory_creatorId_idx" ON "CalendarCategory"("creatorId");

-- CreateIndex
CREATE INDEX "CalendarCategory_companyId_idx" ON "CalendarCategory"("companyId");

-- CreateIndex
CREATE INDEX "CalendarEventAttachment_eventId_idx" ON "CalendarEventAttachment"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_eventId_idx" ON "CalendarEventReminder"("eventId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CalendarCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventRecurrence" ADD CONSTRAINT "CalendarEventRecurrence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventInstance" ADD CONSTRAINT "CalendarEventInstance_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarCategory" ADD CONSTRAINT "CalendarCategory_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarCategory" ADD CONSTRAINT "CalendarCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttachment" ADD CONSTRAINT "CalendarEventAttachment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttachment" ADD CONSTRAINT "CalendarEventAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventReminder" ADD CONSTRAINT "CalendarEventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default calendar categories
INSERT INTO "CalendarCategory" ("name", "colorCode", "icon", "description", "isSystem", "companyId", "sortOrder", "createdAt", "updatedAt")
SELECT
  'Work' as name,
  '#2196F3' as colorCode,
  'work' as icon,
  'Work and business events' as description,
  true as isSystem,
  id as companyId,
  1 as sortOrder,
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Company";

INSERT INTO "CalendarCategory" ("name", "colorCode", "icon", "description", "isSystem", "companyId", "sortOrder", "createdAt", "updatedAt")
SELECT
  'Personal' as name,
  '#4CAF50' as colorCode,
  'person' as icon,
  'Personal events and appointments' as description,
  true as isSystem,
  id as companyId,
  2 as sortOrder,
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Company";

INSERT INTO "CalendarCategory" ("name", "colorCode", "icon", "description", "isSystem", "companyId", "sortOrder", "createdAt", "updatedAt")
SELECT
  'Meeting' as name,
  '#FF9800' as colorCode,
  'groups' as icon,
  'Team meetings and collaborations' as description,
  true as isSystem,
  id as companyId,
  3 as sortOrder,
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Company";

INSERT INTO "CalendarCategory" ("name", "colorCode", "icon", "description", "isSystem", "companyId", "sortOrder", "createdAt", "updatedAt")
SELECT
  'Holiday' as name,
  '#E91E63' as colorCode,
  'event' as icon,
  'Holidays and special days' as description,
  true as isSystem,
  id as companyId,
  4 as sortOrder,
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Company";

INSERT INTO "CalendarCategory" ("name", "colorCode", "icon", "description", "isSystem", "companyId", "sortOrder", "createdAt", "updatedAt")
SELECT
  'Training' as name,
  '#9C27B0' as colorCode,
  'school' as icon,
  'Training sessions and workshops' as description,
  true as isSystem,
  id as companyId,
  5 as sortOrder,
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "Company";