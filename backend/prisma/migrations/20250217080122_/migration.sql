/*
  Warnings:

  - You are about to drop the column `description` on the `RequestForPayment` table. All the data in the column will be lost.
  - Added the required column `memo` to the `RequestForPayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestForPayment" DROP COLUMN "description",
ADD COLUMN     "memo" TEXT NOT NULL,
ADD COLUMN     "projectId" INTEGER,
ADD COLUMN     "purchaseOrderId" INTEGER;

-- AddForeignKey
ALTER TABLE "RequestForPayment" ADD CONSTRAINT "RequestForPayment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestForPayment" ADD CONSTRAINT "RequestForPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
