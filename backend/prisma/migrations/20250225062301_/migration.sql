-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('DOWNPAYMENT', 'PROGRESSIVE', 'RETENTION');

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "CollectionType" NOT NULL,
    "createdById" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
