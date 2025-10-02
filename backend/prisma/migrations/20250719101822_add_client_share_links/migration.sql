-- CreateTable
CREATE TABLE "ClientShareLink" (
    "id" SERIAL NOT NULL,
    "shortCode" VARCHAR(10) NOT NULL,
    "fullToken" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ClientShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientShareLink_shortCode_key" ON "ClientShareLink"("shortCode");

-- AddForeignKey
ALTER TABLE "ClientShareLink" ADD CONSTRAINT "ClientShareLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShareLink" ADD CONSTRAINT "ClientShareLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
