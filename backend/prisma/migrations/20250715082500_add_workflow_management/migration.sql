-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" SERIAL NOT NULL,
    "fromStageId" INTEGER NOT NULL,
    "toStageId" INTEGER,
    "conditionType" TEXT,
    "conditionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowTemplate_companyId_idx" ON "WorkflowTemplate"("companyId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_code_idx" ON "WorkflowTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_companyId_code_key" ON "WorkflowTemplate"("companyId", "code");

-- CreateIndex
CREATE INDEX "WorkflowStage_workflowId_idx" ON "WorkflowStage"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowId_key_key" ON "WorkflowStage"("workflowId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowId_sequence_key" ON "WorkflowStage"("workflowId", "sequence");

-- CreateIndex
CREATE INDEX "WorkflowTransition_fromStageId_idx" ON "WorkflowTransition"("fromStageId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_toStageId_idx" ON "WorkflowTransition"("toStageId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_fromStageId_toStageId_key" ON "WorkflowTransition"("fromStageId", "toStageId");

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "WorkflowStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "WorkflowStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
