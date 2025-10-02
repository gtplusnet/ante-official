-- CreateTable
CREATE TABLE "EmailApprovalToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "templateData" JSONB NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailApprovalToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailApprovalToken_id_key" ON "EmailApprovalToken"("id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailApprovalToken_token_key" ON "EmailApprovalToken"("token");

-- CreateIndex
CREATE INDEX "EmailApprovalToken_token_idx" ON "EmailApprovalToken"("token");

-- CreateIndex
CREATE INDEX "EmailApprovalToken_taskId_idx" ON "EmailApprovalToken"("taskId");

-- AddForeignKey
ALTER TABLE "EmailApprovalToken" ADD CONSTRAINT "EmailApprovalToken_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailApprovalToken" ADD CONSTRAINT "EmailApprovalToken_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
