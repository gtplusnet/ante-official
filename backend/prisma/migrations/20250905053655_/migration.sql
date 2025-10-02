/*
  Warnings:

  - A unique constraint covering the columns `[sourceName,companyId]` on the table `DealSource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[typeName,companyId]` on the table `DealType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeadDealStatus" AS ENUM ('OPPORTUNITY', 'CONTACTED', 'PROPOSAL', 'IN_NEGOTIATION', 'WIN', 'LOST');

-- DropIndex
DROP INDEX "DealSource_sourceName_key";

-- DropIndex
DROP INDEX "DealType_typeName_key";

-- AlterTable
ALTER TABLE "DealSource" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "DealType" ADD COLUMN     "companyId" INTEGER,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "LeadCompany" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "LeadRelationshipOwner" ADD COLUMN     "companyId" INTEGER;

-- CreateTable
CREATE TABLE "LeadDeal" (
    "id" SERIAL NOT NULL,
    "dealName" VARCHAR(255) NOT NULL,
    "dealTypeId" INTEGER,
    "approvedBudgetContract" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyRecurringRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "implementationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalContract" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "winProbability" INTEGER NOT NULL DEFAULT 50,
    "locationId" TEXT,
    "dealSourceId" INTEGER,
    "relationshipOwnerId" TEXT,
    "pointOfContactId" INTEGER,
    "status" "LeadDealStatus" NOT NULL DEFAULT 'OPPORTUNITY',
    "companyId" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeadDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadDeal_dealName_idx" ON "LeadDeal"("dealName");

-- CreateIndex
CREATE INDEX "LeadDeal_closeDate_idx" ON "LeadDeal"("closeDate");

-- CreateIndex
CREATE INDEX "LeadDeal_companyId_isDeleted_idx" ON "LeadDeal"("companyId", "isDeleted");

-- CreateIndex
CREATE INDEX "LeadDeal_status_idx" ON "LeadDeal"("status");

-- CreateIndex
CREATE INDEX "DealSource_companyId_idx" ON "DealSource"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DealSource_sourceName_companyId_key" ON "DealSource"("sourceName", "companyId");

-- CreateIndex
CREATE INDEX "DealType_companyId_idx" ON "DealType"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DealType_typeName_companyId_key" ON "DealType"("typeName", "companyId");

-- CreateIndex
CREATE INDEX "LeadCompany_companyId_idx" ON "LeadCompany"("companyId");

-- CreateIndex
CREATE INDEX "LeadRelationshipOwner_companyId_idx" ON "LeadRelationshipOwner"("companyId");

-- AddForeignKey
ALTER TABLE "LeadRelationshipOwner" ADD CONSTRAINT "LeadRelationshipOwner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealSource" ADD CONSTRAINT "DealSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealType" ADD CONSTRAINT "DealType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealType" ADD CONSTRAINT "DealType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCompany" ADD CONSTRAINT "LeadCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_dealTypeId_fkey" FOREIGN KEY ("dealTypeId") REFERENCES "DealType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_dealSourceId_fkey" FOREIGN KEY ("dealSourceId") REFERENCES "DealSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_relationshipOwnerId_fkey" FOREIGN KEY ("relationshipOwnerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_pointOfContactId_fkey" FOREIGN KEY ("pointOfContactId") REFERENCES "PointOfContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDeal" ADD CONSTRAINT "LeadDeal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
