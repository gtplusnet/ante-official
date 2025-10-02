/*
  Warnings:

  - You are about to drop the column `isComputing` on the `CutoffDateRange` table. All the data in the column will be lost.
  - You are about to drop the column `payslipQueueId` on the `CutoffDateRange` table. All the data in the column will be lost.
  - You are about to drop the column `processingQueueId` on the `CutoffDateRange` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CutoffDateRange" DROP CONSTRAINT "CutoffDateRange_payslipQueueId_fkey";

-- DropForeignKey
ALTER TABLE "CutoffDateRange" DROP CONSTRAINT "CutoffDateRange_processingQueueId_fkey";

-- AlterTable
ALTER TABLE "CutoffDateRange" DROP COLUMN "isComputing",
DROP COLUMN "payslipQueueId",
DROP COLUMN "processingQueueId",
ADD COLUMN     "payrollProcessingQueueId" TEXT,
ADD COLUMN     "payslipProcessingQueueId" TEXT;
