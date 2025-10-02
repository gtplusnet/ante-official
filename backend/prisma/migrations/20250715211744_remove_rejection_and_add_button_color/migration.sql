/*
  Warnings:

  - The values [REJECTION] on the enum `TransitionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rejectFallbackStageId` on the `WorkflowStage` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransitionType_new" AS ENUM ('APPROVAL', 'CONDITIONAL');
ALTER TABLE "WorkflowTransition" ALTER COLUMN "transitionType" DROP DEFAULT;
ALTER TABLE "WorkflowTransition" ALTER COLUMN "transitionType" TYPE "TransitionType_new" USING ("transitionType"::text::"TransitionType_new");
ALTER TYPE "TransitionType" RENAME TO "TransitionType_old";
ALTER TYPE "TransitionType_new" RENAME TO "TransitionType";
DROP TYPE "TransitionType_old";
ALTER TABLE "WorkflowTransition" ALTER COLUMN "transitionType" SET DEFAULT 'APPROVAL';
COMMIT;

-- DropForeignKey
ALTER TABLE "WorkflowStage" DROP CONSTRAINT "WorkflowStage_rejectFallbackStageId_fkey";

-- AlterTable
ALTER TABLE "WorkflowStage" DROP COLUMN "rejectFallbackStageId";

-- AlterTable
ALTER TABLE "WorkflowTransition" ADD COLUMN     "buttonColor" TEXT;
