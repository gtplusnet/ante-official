-- CreateTable
CREATE TABLE "LeadRelationshipOwner" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadRelationshipOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadRelationshipOwner_accountId_idx" ON "LeadRelationshipOwner"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadRelationshipOwner_accountId_key" ON "LeadRelationshipOwner"("accountId");

-- AddForeignKey
ALTER TABLE "LeadRelationshipOwner" ADD CONSTRAINT "LeadRelationshipOwner_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadRelationshipOwner" ADD CONSTRAINT "LeadRelationshipOwner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
