/*
  Warnings:

  - The primary key for the `BillOfQuantity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `BillOfQuantity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BillOfQuantityTable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `BillOfQuantityTable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parentId` column on the `BillOfQuantityTable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `billOfQuantityId` on the `BillOfQuantityTable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_billOfQuantityId_fkey";

-- DropForeignKey
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_parentId_fkey";

-- DropIndex
DROP INDEX "BillOfQuantity_id_key";

-- DropIndex
DROP INDEX "BillOfQuantityTable_id_key";

-- AlterTable
ALTER TABLE "BillOfQuantity" DROP CONSTRAINT "BillOfQuantity_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "BillOfQuantity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "parentId",
ADD COLUMN     "parentId" INTEGER,
DROP COLUMN "billOfQuantityId",
ADD COLUMN     "billOfQuantityId" INTEGER NOT NULL,
ADD CONSTRAINT "BillOfQuantityTable_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantityTable_billOfQuantityId_originalItemId_key" ON "BillOfQuantityTable"("billOfQuantityId", "originalItemId");

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BillOfQuantityTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_billOfQuantityId_fkey" FOREIGN KEY ("billOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
