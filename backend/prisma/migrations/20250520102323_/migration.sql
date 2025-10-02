-- CreateEnum
CREATE TYPE "CutoffDateRangeStatus" AS ENUM ('TIMEKEEPING', 'PENDING', 'PROCESSED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CutoffDateRange" ADD COLUMN     "payslipQueueId" INTEGER,
ADD COLUMN     "processingQueueId" INTEGER,
ADD COLUMN     "status" "CutoffDateRangeStatus" NOT NULL DEFAULT 'TIMEKEEPING';

-- AlterTable
ALTER TABLE "Queue" ADD COLUMN     "queueStatusDescription" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "CutoffDateRange" ADD CONSTRAINT "CutoffDateRange_processingQueueId_fkey" FOREIGN KEY ("processingQueueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CutoffDateRange" ADD CONSTRAINT "CutoffDateRange_payslipQueueId_fkey" FOREIGN KEY ("payslipQueueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
