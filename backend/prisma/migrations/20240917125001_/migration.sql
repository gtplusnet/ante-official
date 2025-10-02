/*
  Warnings:

  - You are about to drop the `SupplierPaymentDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SupplierPaymentDetails" DROP CONSTRAINT "SupplierPaymentDetails_supplierId_fkey";

-- DropTable
DROP TABLE "SupplierPaymentDetails";
