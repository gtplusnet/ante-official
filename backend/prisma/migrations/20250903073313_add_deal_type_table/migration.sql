-- CreateTable
CREATE TABLE "DealType" (
    "id" SERIAL NOT NULL,
    "typeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealType_typeName_key" ON "DealType"("typeName");

-- CreateIndex
CREATE INDEX "DealType_typeName_idx" ON "DealType"("typeName");
