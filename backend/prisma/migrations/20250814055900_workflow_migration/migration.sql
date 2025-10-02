/*
  Warnings:

  - A unique constraint covering the columns `[workflowInstanceId]` on the table `PettyCashLiquidation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "WorkflowStage" DROP CONSTRAINT "WorkflowStage_assignedRole_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowStage" DROP CONSTRAINT "WorkflowStage_assignedUser_fkey";

-- AlterTable
ALTER TABLE "PettyCashLiquidation" ADD COLUMN     "workflowInstanceId" INTEGER;

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "currentStageId" INTEGER NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startedById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowHistory" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "fromStageId" INTEGER,
    "toStageId" INTEGER NOT NULL,
    "transitionId" INTEGER,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "metadata" JSONB,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowButtonConfig" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "transitionCode" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "buttonColor" TEXT NOT NULL,
    "buttonIcon" TEXT,
    "buttonSize" TEXT NOT NULL DEFAULT 'medium',
    "confirmationRequired" BOOLEAN NOT NULL DEFAULT false,
    "confirmationTitle" TEXT,
    "confirmationMessage" TEXT,
    "remarkRequired" BOOLEAN NOT NULL DEFAULT false,
    "remarkPrompt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'ALWAYS',
    "customClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowButtonConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowInstance_workflowId_idx" ON "WorkflowInstance"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_currentStageId_idx" ON "WorkflowInstance"("currentStageId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_status_idx" ON "WorkflowInstance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowInstance_sourceModule_sourceId_key" ON "WorkflowInstance"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_instanceId_idx" ON "WorkflowHistory"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_performedById_idx" ON "WorkflowHistory"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTask_taskId_key" ON "WorkflowTask"("taskId");

-- CreateIndex
CREATE INDEX "WorkflowTask_instanceId_idx" ON "WorkflowTask"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowTask_taskId_idx" ON "WorkflowTask"("taskId");

-- CreateIndex
CREATE INDEX "WorkflowButtonConfig_templateId_idx" ON "WorkflowButtonConfig"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowButtonConfig_templateId_transitionCode_key" ON "WorkflowButtonConfig"("templateId", "transitionCode");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashLiquidation_workflowInstanceId_key" ON "PettyCashLiquidation"("workflowInstanceId");

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "WorkflowInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "WorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "WorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "WorkflowTransition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "WorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowButtonConfig" ADD CONSTRAINT "WorkflowButtonConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
