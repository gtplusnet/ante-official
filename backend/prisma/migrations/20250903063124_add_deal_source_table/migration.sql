-- CreateTable
CREATE TABLE "DealSource" (
    "id" SERIAL NOT NULL,
    "sourceName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealSource_sourceName_key" ON "DealSource"("sourceName");

-- CreateIndex
CREATE INDEX "DealSource_sourceName_idx" ON "DealSource"("sourceName");

-- AddForeignKey
ALTER TABLE "DealSource" ADD CONSTRAINT "DealSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
