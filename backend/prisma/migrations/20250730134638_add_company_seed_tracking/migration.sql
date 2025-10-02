-- CreateTable
CREATE TABLE "CompanySeedTracking" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "seederType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "seedDate" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySeedTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanySeedTracking_companyId_seederType_key" ON "CompanySeedTracking"("companyId", "seederType");

-- AddForeignKey
ALTER TABLE "CompanySeedTracking" ADD CONSTRAINT "CompanySeedTracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
