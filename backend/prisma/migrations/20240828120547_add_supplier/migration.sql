-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPaymentDetails" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "days" INTEGER NOT NULL,
    "lateFees" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "additionalDetails" TEXT,

    CONSTRAINT "SupplierPaymentDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- AddForeignKey
ALTER TABLE "SupplierPaymentDetails" ADD CONSTRAINT "SupplierPaymentDetails_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
