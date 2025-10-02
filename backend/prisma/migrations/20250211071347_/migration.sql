-- CreateEnum
CREATE TYPE "repairStages" AS ENUM ('PENDING_REPAIR', 'UNDER_REPAIR', 'REPAIR_CONFIRMATION', 'DONE_REPAIR');

-- AlterTable
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD COLUMN     "repairStage" "repairStages" NOT NULL DEFAULT 'PENDING_REPAIR';
