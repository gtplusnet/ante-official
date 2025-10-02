-- CreateTable
CREATE TABLE "PayrollApprovers" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollApprovers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PayrollApprovers" ADD CONSTRAINT "PayrollApprovers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollApprovers" ADD CONSTRAINT "PayrollApprovers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
