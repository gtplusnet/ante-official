-- CreateTable
CREATE TABLE "DiscussionMessageRead" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "discussionId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadMessageId" INTEGER,

    CONSTRAINT "DiscussionMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscussionMessageRead_accountId_discussionId_idx" ON "DiscussionMessageRead"("accountId", "discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionMessageRead_accountId_messageId_key" ON "DiscussionMessageRead"("accountId", "messageId");

-- AddForeignKey
ALTER TABLE "DiscussionMessageRead" ADD CONSTRAINT "DiscussionMessageRead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessageRead" ADD CONSTRAINT "DiscussionMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessageRead" ADD CONSTRAINT "DiscussionMessageRead_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
