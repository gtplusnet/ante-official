-- AlterTable
ALTER TABLE "ItemReceipt" ALTER COLUMN "paymentTerms" SET DEFAULT 'NO_PAYMENT_TERMS';

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "paymentTerms" SET DEFAULT 'NO_PAYMENT_TERMS';
