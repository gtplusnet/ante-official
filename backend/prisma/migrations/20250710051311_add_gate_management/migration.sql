-- CreateTable
CREATE TABLE "Gate" (
    "id" TEXT NOT NULL,
    "gateName" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gate_companyId_idx" ON "Gate"("companyId");

-- CreateIndex
CREATE INDEX "Gate_deletedAt_idx" ON "Gate"("deletedAt");

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
