-- CreateTable
CREATE TABLE "BranchTimekeepingStatus" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "cutoffDateRangeId" TEXT NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "markedReadyBy" TEXT,
    "markedReadyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchTimekeepingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchTimekeepingStatus_cutoffDateRangeId_idx" ON "BranchTimekeepingStatus"("cutoffDateRangeId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchTimekeepingStatus_branchId_cutoffDateRangeId_key" ON "BranchTimekeepingStatus"("branchId", "cutoffDateRangeId");

-- AddForeignKey
ALTER TABLE "BranchTimekeepingStatus" ADD CONSTRAINT "BranchTimekeepingStatus_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTimekeepingStatus" ADD CONSTRAINT "BranchTimekeepingStatus_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchTimekeepingStatus" ADD CONSTRAINT "BranchTimekeepingStatus_markedReadyBy_fkey" FOREIGN KEY ("markedReadyBy") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
