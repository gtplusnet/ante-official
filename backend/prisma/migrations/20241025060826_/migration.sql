-- CreateTable
CREATE TABLE "LocationProvince" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "LocationProvince_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocationProvince" ADD CONSTRAINT "LocationProvince_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "LocationRegion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
