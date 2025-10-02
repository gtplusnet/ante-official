-- AlterTable
ALTER TABLE "WorkflowTemplate" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isDeleted_companyId_idx" ON "WorkflowTemplate"("isDeleted", "companyId");

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
