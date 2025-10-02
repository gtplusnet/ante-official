/*
  Warnings:

  - The primary key for the `Files` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uplaodedBId` on the `Files` table. All the data in the column will be lost.
  - The `id` column on the `Files` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `uplaodedById` to the `Files` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Files" DROP CONSTRAINT "Files_uplaodedBId_fkey";

-- AlterTable
ALTER TABLE "Files" DROP CONSTRAINT "Files_pkey",
DROP COLUMN "uplaodedBId",
ADD COLUMN     "uplaodedById" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "encoding" DROP NOT NULL,
ADD CONSTRAINT "Files_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_uplaodedById_fkey" FOREIGN KEY ("uplaodedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
