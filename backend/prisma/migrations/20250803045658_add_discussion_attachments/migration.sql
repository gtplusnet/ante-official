-- AlterTable
ALTER TABLE "DiscussionMessage" ADD COLUMN     "attachmentId" INTEGER;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
