-- CreateTable
CREATE TABLE "projectAccomplishment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectAccomplishment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projectAccomplishment" ADD CONSTRAINT "projectAccomplishment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectAccomplishment" ADD CONSTRAINT "projectAccomplishment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
