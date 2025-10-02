-- AlterEnum
ALTER TYPE "PaymentTerms" ADD VALUE 'NO_PAYMENT_TERMS';

-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'CASH_ON_DELIVERY',
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'NO_TAX';
