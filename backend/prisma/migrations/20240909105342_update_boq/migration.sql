/*
  Warnings:

  - Changed the type of `type` on the `BillOfQuantityTable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BoqType" AS ENUM ('HEADING', 'SUBHEADING', 'ITEM', 'ITEM1', 'ITEM2', 'ITEM3', 'BLANK_ROW');

-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP COLUMN "type",
ADD COLUMN     "type" "BoqType" NOT NULL;
