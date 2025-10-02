/*
  Warnings:

  - You are about to drop the column `isRecurring` on the `DeductionPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeductionPlan" DROP COLUMN "isRecurring",
ADD COLUMN     "deductionPeriod" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "effectivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
