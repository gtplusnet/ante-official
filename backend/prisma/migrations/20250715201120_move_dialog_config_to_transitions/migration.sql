/*
  Warnings:

  - You are about to drop the column `customDialogConfig` on the `WorkflowStage` table. All the data in the column will be lost.
  - You are about to drop the column `dialogType` on the `WorkflowStage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkflowStage" DROP COLUMN "customDialogConfig",
DROP COLUMN "dialogType";

-- AlterTable
ALTER TABLE "WorkflowTransition" ADD COLUMN     "buttonName" TEXT,
ADD COLUMN     "customDialogConfig" JSONB,
ADD COLUMN     "dialogType" TEXT;
