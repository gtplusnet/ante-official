/*
  Warnings:

  - The primary key for the `BillOfQuantityTable` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_parentId_fkey";

-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_pkey",
ADD COLUMN     "key" SERIAL NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ADD CONSTRAINT "BillOfQuantityTable_pkey" PRIMARY KEY ("key");
DROP SEQUENCE "BillOfQuantityTable_id_seq";

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BillOfQuantityTable"("key") ON DELETE SET NULL ON UPDATE CASCADE;
