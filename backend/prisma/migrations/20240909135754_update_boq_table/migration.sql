/*
  Warnings:

  - The values [ITEM1,ITEM2,ITEM3] on the enum `BoqType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `unit` on the `BillOfQuantityTable` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BoqType_new" AS ENUM ('HEADING', 'SUBHEADING', 'ITEM', 'SUBTOTAL', 'BLANK_ROW');
ALTER TABLE "BillOfQuantityTable" ALTER COLUMN "type" TYPE "BoqType_new" USING ("type"::text::"BoqType_new");
ALTER TYPE "BoqType" RENAME TO "BoqType_old";
ALTER TYPE "BoqType_new" RENAME TO "BoqType";
DROP TYPE "BoqType_old";
COMMIT;

-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP COLUMN "unit",
ADD COLUMN     "materialUnit" TEXT;
