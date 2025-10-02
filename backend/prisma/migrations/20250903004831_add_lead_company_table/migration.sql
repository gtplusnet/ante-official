-- CreateTable
CREATE TABLE "LeadCompany" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "deals" INTEGER NOT NULL DEFAULT 0,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadCompany_name_idx" ON "LeadCompany"("name");
