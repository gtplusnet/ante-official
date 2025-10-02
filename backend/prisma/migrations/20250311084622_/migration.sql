/*
  Warnings:

  - You are about to drop the column `name` on the `NationalHoliday` table. All the data in the column will be lost.
  - Added the required column `holidayName` to the `NationalHoliday` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NationalHoliday" DROP COLUMN "name",
ADD COLUMN     "holidayName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "LocalHoliday" (
    "id" SERIAL NOT NULL,
    "holidayName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "HolidayType" NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalHoliday_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocalHoliday" ADD CONSTRAINT "LocalHoliday_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "LocationProvince"("id") ON DELETE CASCADE ON UPDATE CASCADE;
