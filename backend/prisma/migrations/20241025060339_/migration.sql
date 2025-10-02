/*
  Warnings:

  - You are about to drop the `Region` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Region";

-- CreateTable
CREATE TABLE "LocationRegion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "LocationRegion_pkey" PRIMARY KEY ("id")
);
