/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `DeductionPlan` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AllowanceType" AS ENUM ('ALLOWANCE', 'DEMINIMIS');

-- CreateEnum
CREATE TYPE "TaxBasis" AS ENUM ('TAXABLE', 'NON_TAXABLE');

-- AlterTable
ALTER TABLE "DeductionPlan" DROP COLUMN "isDeleted";

-- CreateTable
CREATE TABLE "AllowanceConfiguration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AllowanceType" NOT NULL,
    "taxBasis" "TaxBasis" NOT NULL,
    "parentDeductionId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowanceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowancePlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectivityDate" TIMESTAMP(3) NOT NULL,
    "allowanceConfigurationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowancePlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AllowanceConfiguration" ADD CONSTRAINT "AllowanceConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowancePlan" ADD CONSTRAINT "AllowancePlan_allowanceConfigurationId_fkey" FOREIGN KEY ("allowanceConfigurationId") REFERENCES "AllowanceConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowancePlan" ADD CONSTRAINT "AllowancePlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
