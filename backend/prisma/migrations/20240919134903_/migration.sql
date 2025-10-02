/*
  Warnings:

  - The primary key for the `FundAccount` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FundAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FundTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FundTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `fundAccountId` on the `FundTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "FundTransaction" DROP CONSTRAINT "FundTransaction_fundAccountId_fkey";

-- AlterTable
ALTER TABLE "FundAccount" DROP CONSTRAINT "FundAccount_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FundAccount_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FundTransaction" DROP CONSTRAINT "FundTransaction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "fundAccountId",
ADD COLUMN     "fundAccountId" INTEGER NOT NULL,
ADD CONSTRAINT "FundTransaction_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "FundAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
