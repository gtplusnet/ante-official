/*
  Warnings:

  - You are about to drop the column `version` on the `BillOfQuantity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractId,revision]` on the table `BillOfQuantity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BillOfQuantity_contractId_version_key";

-- AlterTable
ALTER TABLE "BillOfQuantity" DROP COLUMN "version",
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantity_contractId_revision_key" ON "BillOfQuantity"("contractId", "revision");
