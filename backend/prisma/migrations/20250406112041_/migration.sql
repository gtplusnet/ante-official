-- CreateTable
CREATE TABLE "CutoffDateRange" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "processingDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CutoffDateRange_pkey" PRIMARY KEY ("id")
);
