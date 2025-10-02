/*
  Warnings:

  - You are about to drop the column `licenseType` on the `DeviceLicense` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeviceLicense" DROP COLUMN "licenseType",
ADD COLUMN     "gateId" TEXT;

-- DropEnum
DROP TYPE "LicenseType";

-- CreateIndex
CREATE INDEX "DeviceLicense_gateId_idx" ON "DeviceLicense"("gateId");

-- AddForeignKey
ALTER TABLE "DeviceLicense" ADD CONSTRAINT "DeviceLicense_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
