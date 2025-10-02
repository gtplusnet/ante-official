-- AlterTable
ALTER TABLE "AllowancePlanHistory" ADD COLUMN     "cutoffDateRangeId" TEXT;

-- AlterTable
ALTER TABLE "DeductionPlanHistory" ADD COLUMN     "cutoffDateRangeId" TEXT;

-- CreateIndex
CREATE INDEX "AllowancePlanHistory_cutoffDateRangeId_idx" ON "AllowancePlanHistory"("cutoffDateRangeId");

-- CreateIndex
CREATE INDEX "DeductionPlanHistory_cutoffDateRangeId_idx" ON "DeductionPlanHistory"("cutoffDateRangeId");

-- AddForeignKey
ALTER TABLE "DeductionPlanHistory" ADD CONSTRAINT "DeductionPlanHistory_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowancePlanHistory" ADD CONSTRAINT "AllowancePlanHistory_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
