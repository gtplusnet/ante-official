/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `AllowanceConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `DeductionConfiguration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AllowanceConfiguration_name_companyId_key" ON "AllowanceConfiguration"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionConfiguration_name_companyId_key" ON "DeductionConfiguration"("name", "companyId");
