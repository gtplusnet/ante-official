-- CreateTable
CREATE TABLE "CashierData" (
    "accountId" TEXT NOT NULL,
    "cashierCode" TEXT NOT NULL DEFAULT '',
    "branchId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CashierData_accountId_key" ON "CashierData"("accountId");

-- CreateIndex
CREATE INDEX "CashierData_cashierCode_idx" ON "CashierData"("cashierCode");

-- CreateIndex
CREATE INDEX "CashierData_branchId_idx" ON "CashierData"("branchId");

-- CreateIndex
CREATE INDEX "idx_cashier_branch_active" ON "CashierData"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "idx_cashier_created" ON "CashierData"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "CashierData" ADD CONSTRAINT "CashierData_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierData" ADD CONSTRAINT "CashierData_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
