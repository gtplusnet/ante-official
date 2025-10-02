-- CreateTable
CREATE TABLE "PayrollApprovalHistory" (
    "id" SERIAL NOT NULL,
    "cutoffDateRangeId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PayrollApprovalHistory" ADD CONSTRAINT "PayrollApprovalHistory_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollApprovalHistory" ADD CONSTRAINT "PayrollApprovalHistory_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
