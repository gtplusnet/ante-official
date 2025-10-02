/*
  Warnings:

  - You are about to drop the column `brgy` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `line1` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Location` table. All the data in the column will be lost.
  - Added the required column `barangayId` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipalityId` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provinceId` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "brgy",
DROP COLUMN "city",
DROP COLUMN "line1",
DROP COLUMN "region",
ADD COLUMN     "barangayId" INTEGER NOT NULL,
ADD COLUMN     "municipalityId" INTEGER NOT NULL,
ADD COLUMN     "provinceId" INTEGER NOT NULL,
ADD COLUMN     "regionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "LocationRegion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "LocationProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "LocationMunicipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "LocationBarangay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
