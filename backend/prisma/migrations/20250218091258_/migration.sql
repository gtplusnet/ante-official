-- AlterTable
ALTER TABLE "PettyCashLiquidation" ADD COLUMN     "attachmentProofId" INTEGER;

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_attachmentProofId_fkey" FOREIGN KEY ("attachmentProofId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
