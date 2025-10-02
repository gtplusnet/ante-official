-- CreateTable
CREATE TABLE "LocationMunicipality" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "LocationMunicipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationBarangay" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "municipalityId" INTEGER NOT NULL,

    CONSTRAINT "LocationBarangay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocationMunicipality" ADD CONSTRAINT "LocationMunicipality_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "LocationProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBarangay" ADD CONSTRAINT "LocationBarangay_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "LocationMunicipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
