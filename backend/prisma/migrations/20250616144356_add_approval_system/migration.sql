/*
  Warnings:

  - A unique constraint covering the columns `[companyId,approvalLevel,accountId]` on the table `PayrollApprovers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('NORMAL', 'APPROVAL', 'REVIEW', 'NOTIFICATION');

-- AlterTable
ALTER TABLE "PayrollApprovers" ADD COLUMN     "approvalLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PayrollFiling" ADD COLUMN     "approvalTaskId" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "ApprovalMetadata" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceData" JSONB,
    "actions" JSONB NOT NULL DEFAULT '["approve", "reject"]',
    "approvalLevel" INTEGER NOT NULL DEFAULT 1,
    "maxApprovalLevel" INTEGER NOT NULL DEFAULT 1,
    "approvalChain" JSONB,
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalMetadata_taskId_key" ON "ApprovalMetadata"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollApprovers_companyId_approvalLevel_accountId_key" ON "PayrollApprovers"("companyId", "approvalLevel", "accountId");

-- AddForeignKey
ALTER TABLE "ApprovalMetadata" ADD CONSTRAINT "ApprovalMetadata_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
