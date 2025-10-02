/*
  Warnings:

  - The values [SUBITEM,DETAILITEM] on the enum `BoqType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ParticularType" AS ENUM ('INVENTORY', 'MANPOWER', 'EQUIPMENT');

-- AlterEnum
BEGIN;
CREATE TYPE "BoqType_new" AS ENUM ('HEADING', 'SUBHEADING', 'ITEM', 'ITEM1', 'ITEM2', 'ITEM3', 'BLANK_ROW');
ALTER TABLE "BillOfQuantityTable" ALTER COLUMN "type" TYPE "BoqType_new" USING ("type"::text::"BoqType_new");
ALTER TYPE "BoqType" RENAME TO "BoqType_old";
ALTER TYPE "BoqType_new" RENAME TO "BoqType";
DROP TYPE "BoqType_old";
COMMIT;

-- AlterTable
ALTER TABLE "BillOfQuantityTable" ADD COLUMN     "particularType" "ParticularType";
