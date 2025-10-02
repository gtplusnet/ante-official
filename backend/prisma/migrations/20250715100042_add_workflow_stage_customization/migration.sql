/*
  Warnings:

  - A unique constraint covering the columns `[fromStageId,toStageId,transitionType]` on the table `WorkflowTransition` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssigneeType" AS ENUM ('DEPARTMENT', 'ROLE', 'SPECIFIC_USER', 'DIRECT_SUPERVISOR');

-- CreateEnum
CREATE TYPE "TransitionType" AS ENUM ('APPROVAL', 'REJECTION', 'CONDITIONAL');

-- DropIndex
DROP INDEX "WorkflowTransition_fromStageId_toStageId_key";

-- AlterTable
ALTER TABLE "WorkflowStage" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "assigneeType" "AssigneeType",
ADD COLUMN     "customDialogConfig" JSONB,
ADD COLUMN     "dialogType" TEXT,
ADD COLUMN     "rejectFallbackStageId" INTEGER;

-- AlterTable
ALTER TABLE "WorkflowTransition" ADD COLUMN     "transitionType" "TransitionType" NOT NULL DEFAULT 'APPROVAL';

-- CreateIndex
CREATE INDEX "WorkflowStage_assigneeId_idx" ON "WorkflowStage"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_fromStageId_toStageId_transitionType_key" ON "WorkflowTransition"("fromStageId", "toStageId", "transitionType");

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_rejectFallbackStageId_fkey" FOREIGN KEY ("rejectFallbackStageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_assignedRole_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_assignedUser_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
