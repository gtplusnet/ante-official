-- CreateTable
CREATE TABLE "PointOfContact" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "jobTitle" VARCHAR(100),
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointOfContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointOfContact_fullName_idx" ON "PointOfContact"("fullName");

-- CreateIndex
CREATE INDEX "PointOfContact_email_idx" ON "PointOfContact"("email");

-- CreateIndex
CREATE INDEX "PointOfContact_companyId_idx" ON "PointOfContact"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfContact_email_companyId_key" ON "PointOfContact"("email", "companyId");

-- AddForeignKey
ALTER TABLE "PointOfContact" ADD CONSTRAINT "PointOfContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "LeadCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointOfContact" ADD CONSTRAINT "PointOfContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
