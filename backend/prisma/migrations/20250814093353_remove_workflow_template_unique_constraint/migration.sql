-- DropIndex
DROP INDEX "WorkflowTemplate_companyId_code_key";

-- CreateIndex
CREATE INDEX "WorkflowTemplate_companyId_code_isDeleted_idx" ON "WorkflowTemplate"("companyId", "code", "isDeleted");
