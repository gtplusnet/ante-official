/*
  Warnings:

  - Added the required column `locationId` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('NO_TAX', 'VAT');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "locationId" TEXT NOT NULL,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'VAT';

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
