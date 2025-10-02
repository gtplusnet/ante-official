-- CreateTable
CREATE TABLE "RequestForPayment" (
    "id" SERIAL NOT NULL,
    "payeeType" "PayeeType" NOT NULL,
    "payeeId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestForPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestForPayment_payeeType_payeeId_idx" ON "RequestForPayment"("payeeType", "payeeId");
