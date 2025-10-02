-- CreateTable
CREATE TABLE "PettyCashTransactions" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "type" "FundTransactionType" NOT NULL,
    "code" "FundTransactionCode" NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashTransactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PettyCashTransactions" ADD CONSTRAINT "PettyCashTransactions_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
