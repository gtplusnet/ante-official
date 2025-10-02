/*
  Warnings:

  - A unique constraint covering the columns `[deductionConfigurationId,accountId]` on the table `DeductionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DeductionPlan_deductionConfigurationId_accountId_key" ON "DeductionPlan"("deductionConfigurationId", "accountId");
