-- CreateEnum
CREATE TYPE "CRMActivityType" AS ENUM ('CREATE', 'UPDATE', 'STAGE_CHANGE', 'DELETE');

-- CreateEnum
CREATE TYPE "CRMEntityType" AS ENUM ('LEAD', 'LEAD_DEAL', 'CLIENT', 'LEAD_COMPANY', 'POINT_OF_CONTACT', 'DEAL_TYPE', 'DEAL_SOURCE');

-- CreateTable
CREATE TABLE "CRMActivity" (
    "id" SERIAL NOT NULL,
    "activityType" "CRMActivityType" NOT NULL,
    "entityType" "CRMEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityName" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER,

    CONSTRAINT "CRMActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CRMActivity_companyId_createdAt_idx" ON "CRMActivity"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CRMActivity_performedById_idx" ON "CRMActivity"("performedById");

-- CreateIndex
CREATE INDEX "CRMActivity_isRead_idx" ON "CRMActivity"("isRead");

-- CreateIndex
CREATE INDEX "CRMActivity_entityType_entityId_idx" ON "CRMActivity"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMActivity" ADD CONSTRAINT "CRMActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
