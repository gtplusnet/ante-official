-- CreateTable
CREATE TABLE "PettyCashLiquidation" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashLiquidation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
