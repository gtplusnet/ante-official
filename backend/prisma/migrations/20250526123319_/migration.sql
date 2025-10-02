-- CreateTable
CREATE TABLE "AllowancePlanHistory" (
    "id" SERIAL NOT NULL,
    "allowancePlanId" INTEGER NOT NULL,
    "transactionCode" "FundTransactionCode" NOT NULL DEFAULT 'BEGINNING_BALANCE',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT NOT NULL,
    "beforeBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "afterBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowancePlanHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AllowancePlanHistory" ADD CONSTRAINT "AllowancePlanHistory_allowancePlanId_fkey" FOREIGN KEY ("allowancePlanId") REFERENCES "AllowancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
