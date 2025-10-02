-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "clientLogoId" INTEGER;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "street" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_clientLogoId_fkey" FOREIGN KEY ("clientLogoId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
