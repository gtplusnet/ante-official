-- CreateEnum
CREATE TYPE "CutOffType" AS ENUM ('WEEKLY', 'SEMIMONTHLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Cutoff" (
    "id" SERIAL NOT NULL,
    "cutoffCode" TEXT NOT NULL,
    "cutoffType" "CutOffType" NOT NULL,
    "cutoffConfig" JSONB NOT NULL DEFAULT '{}',
    "processingDays" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Cutoff_pkey" PRIMARY KEY ("id")
);
