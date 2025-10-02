-- CreateEnum
CREATE TYPE "TaskPhaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "TaskPhase" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" INTEGER NOT NULL,
    "status" "TaskPhaseStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "TaskPhase_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "taskPhaseId" INTEGER,
ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TaskPhase_projectId_isDeleted_order_idx" ON "TaskPhase"("projectId", "isDeleted", "order");

-- CreateIndex
CREATE INDEX "TaskPhase_companyId_idx" ON "TaskPhase"("companyId");

-- AddForeignKey
ALTER TABLE "TaskPhase" ADD CONSTRAINT "TaskPhase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPhase" ADD CONSTRAINT "TaskPhase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_taskPhaseId_fkey" FOREIGN KEY ("taskPhaseId") REFERENCES "TaskPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create RPC function for atomic phase activation
CREATE OR REPLACE FUNCTION activate_task_phase(phase_id INT)
RETURNS void AS $$
BEGIN
  -- Update phase status to ACTIVE
  UPDATE "TaskPhase"
  SET status = 'ACTIVE',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = phase_id
  AND status = 'DRAFT';  -- Only activate if currently DRAFT

  -- Update all tasks in the phase to non-draft
  UPDATE "Task"
  SET "isDraft" = false,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "taskPhaseId" = phase_id
  AND "isDraft" = true;  -- Only update draft tasks
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION activate_task_phase TO authenticated;