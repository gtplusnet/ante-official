-- CreateTable
CREATE TABLE "SchoolSection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "gradeLevelId" INTEGER NOT NULL,
    "adviserName" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "capacity" INTEGER,
    "companyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolSection_gradeLevelId_idx" ON "SchoolSection"("gradeLevelId");

-- CreateIndex
CREATE INDEX "SchoolSection_companyId_idx" ON "SchoolSection"("companyId");

-- AddForeignKey
ALTER TABLE "SchoolSection" ADD CONSTRAINT "SchoolSection_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSection" ADD CONSTRAINT "SchoolSection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;