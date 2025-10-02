/*
  Warnings:

  - The values [WORKING_CONDITION] on the enum `EquipmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `EquipmentMaintenanceHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_EquipmentMaintenanceHistories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `EquipmentMaintenanceHistory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `EquipmentMaintenanceHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EquipmentStatus_new" AS ENUM ('FOR_REPAIR', 'WORKING', 'REPAIRED', 'BRANDNEW');
ALTER TABLE "EquipmentModel" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EquipmentModel" ALTER COLUMN "status" TYPE "EquipmentStatus_new" USING ("status"::text::"EquipmentStatus_new");
ALTER TYPE "EquipmentStatus" RENAME TO "EquipmentStatus_old";
ALTER TYPE "EquipmentStatus_new" RENAME TO "EquipmentStatus";
DROP TYPE "EquipmentStatus_old";
ALTER TABLE "EquipmentModel" ALTER COLUMN "status" SET DEFAULT 'WORKING';
COMMIT;

-- DropForeignKey
ALTER TABLE "_EquipmentMaintenanceHistories" DROP CONSTRAINT "_EquipmentMaintenanceHistories_A_fkey";

-- DropForeignKey
ALTER TABLE "_EquipmentMaintenanceHistories" DROP CONSTRAINT "_EquipmentMaintenanceHistories_B_fkey";

-- AlterTable
ALTER TABLE "EquipmentMaintenanceHistory" DROP CONSTRAINT "EquipmentMaintenanceHistory_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ADD CONSTRAINT "EquipmentMaintenanceHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "EquipmentModel" ALTER COLUMN "status" SET DEFAULT 'WORKING';

-- DropTable
DROP TABLE "_EquipmentMaintenanceHistories";

-- CreateTable
CREATE TABLE "EquipmentModelMaintenanceHistory" (
    "equipmentModelId" UUID NOT NULL,
    "equipmentMaintenanceHistoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentModelMaintenanceHistory_pkey" PRIMARY KEY ("equipmentModelId","equipmentMaintenanceHistoryId")
);

-- AddForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" ADD CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentModelId_fkey" FOREIGN KEY ("equipmentModelId") REFERENCES "EquipmentModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" ADD CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentMaintenanceHisto_fkey" FOREIGN KEY ("equipmentMaintenanceHistoryId") REFERENCES "EquipmentMaintenanceHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
