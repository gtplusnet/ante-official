-- CreateTable
CREATE TABLE "DiscussionWatchers" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,

    CONSTRAINT "DiscussionWatchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionWatchers_accountId_discussionId_key" ON "DiscussionWatchers"("accountId", "discussionId");

-- AddForeignKey
ALTER TABLE "DiscussionWatchers" ADD CONSTRAINT "DiscussionWatchers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionWatchers" ADD CONSTRAINT "DiscussionWatchers_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
