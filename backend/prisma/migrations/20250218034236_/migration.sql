-- CreateTable
CREATE TABLE "RequestForPaymentActions" (
    "id" SERIAL NOT NULL,
    "requestForPaymentId" INTEGER NOT NULL,
    "actionByAccountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "fromStatus" "RequestForPaymentStatus" NOT NULL,
    "toStatus" "RequestForPaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestForPaymentActions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestForPaymentActions" ADD CONSTRAINT "RequestForPaymentActions_requestForPaymentId_fkey" FOREIGN KEY ("requestForPaymentId") REFERENCES "RequestForPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestForPaymentActions" ADD CONSTRAINT "RequestForPaymentActions_actionByAccountId_fkey" FOREIGN KEY ("actionByAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
